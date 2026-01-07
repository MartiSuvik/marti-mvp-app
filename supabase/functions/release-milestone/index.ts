// Supabase Edge Function: release-milestone
// Releases payment for a single milestone to the agency's connected account

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const { milestone_id } = await req.json();

    if (!milestone_id) {
      return new Response(JSON.stringify({ error: "milestone_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get milestone with job and agency info
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select(`
        id,
        job_id,
        title,
        amount,
        currency,
        status,
        jobs (
          id,
          business_id,
          agency_id,
          status,
          amount,
          total_released,
          agencies (
            id,
            name,
            stripe_account_id
          ),
          job_payments (
            stripe_charge_id,
            stripe_payment_intent_id
          )
        )
      `)
      .eq("id", milestone_id)
      .single();

    if (milestoneError || !milestone) {
      return new Response(JSON.stringify({ error: "Milestone not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = milestone.jobs as any;
    const agency = job.agencies as any;

    // Verify user owns this job
    if (job.business_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized to release this milestone" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify job is funded
    if (!["funded", "in_progress", "review", "revision"].includes(job.status)) {
      return new Response(JSON.stringify({ error: `Cannot release milestone - job status is ${job.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify milestone is approved (ready for payment)
    if (milestone.status !== "approved") {
      return new Response(JSON.stringify({ error: `Milestone must be approved first. Current status: ${milestone.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agency has Stripe account
    if (!agency?.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Agency has not connected Stripe account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate amount in cents
    const amountValue = parseFloat(milestone.amount) || 0;
    const amountInCents = Math.round(amountValue * 100);

    if (amountInCents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid milestone amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Releasing milestone ${milestone.id}: ${amountInCents} cents to ${agency.stripe_account_id}`);

    // Get charge ID for source_transaction (allows transfer before funds settle)
    const jobPayment = job.job_payments?.[0];
    const chargeId = jobPayment?.stripe_charge_id;

    // Build transfer params
    const transferParams: any = {
      amount: amountInCents,
      currency: milestone.currency.toLowerCase(),
      destination: agency.stripe_account_id,
      metadata: {
        milestone_id: milestone.id,
        job_id: job.id,
        agency_id: agency.id,
        platform: "scalingad",
      },
      description: `Milestone: ${milestone.title}`,
    };

    // If we have a charge ID, use source_transaction to link the transfer
    // This allows transfers even before funds have settled
    if (chargeId) {
      transferParams.source_transaction = chargeId;
      console.log(`Using source_transaction: ${chargeId}`);
    }

    let transfer;
    try {
      transfer = await stripe.transfers.create(transferParams);
    } catch (stripeError: any) {
      // Handle insufficient funds error with friendly message
      if (stripeError.code === "balance_insufficient") {
        return new Response(JSON.stringify({ 
          error: "Payment is still processing. Funds typically settle within 2 business days. Please try again later.",
          code: "funds_settling"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw stripeError;
    }

    console.log(`Transfer created: ${transfer.id}`);

    // Update milestone status to paid
    await supabase
      .from("milestones")
      .update({
        status: "paid",
        stripe_transfer_id: transfer.id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestone.id);

    // Update job total_released
    const currentReleased = parseFloat(job.total_released) || 0;
    const newTotalReleased = currentReleased + amountValue;
    
    await supabase
      .from("jobs")
      .update({
        total_released: newTotalReleased,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Check if all milestones are paid - if so, mark job as paid_out
    const { data: allMilestones } = await supabase
      .from("milestones")
      .select("status")
      .eq("job_id", job.id);

    const allPaid = allMilestones?.every(m => m.status === "paid");
    
    if (allPaid) {
      await supabase
        .from("jobs")
        .update({
          status: "paid_out",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    // Log to job_payouts
    await supabase.from("job_payouts").insert({
      job_id: job.id,
      stripe_transfer_id: transfer.id,
      amount: amountValue,
      status: "completed",
    });

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: user.id,
      event_type: "milestone_released",
      details: {
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        amount: amountValue,
        currency: milestone.currency,
        transfer_id: transfer.id,
        agency_account: agency.stripe_account_id,
        total_released: newTotalReleased,
        all_milestones_paid: allPaid,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        amount_released: amountValue,
        total_released: newTotalReleased,
        all_milestones_paid: allPaid,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error releasing milestone:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
