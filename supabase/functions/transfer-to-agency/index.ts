// Supabase Edge Function: transfer-to-agency
// Releases funds to the agency after work is approved
// Note: With destination charges, funds are automatically transferred
// This function is for manual releases or milestone-based payments

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get request body
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        business_id,
        agency_id,
        amount,
        currency,
        platform_fee,
        status,
        agencies (
          id,
          name,
          stripe_account_id
        )
      `)
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify job is approved
    if (job.status !== "approved") {
      return new Response(JSON.stringify({ error: `Job must be approved to release funds. Current status: ${job.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agency = job.agencies as any;
    if (!agency?.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Agency has not connected Stripe" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("job_payments")
      .select("*")
      .eq("job_id", job_id)
      .eq("status", "succeeded")
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: "No successful payment found for this job" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // With destination charges, the transfer happens automatically when payment succeeds
    // This endpoint is mainly for tracking/confirmation
    // If we were using separate charges & transfers, we'd create a transfer here:
    
    // For separate charges model (if needed in future):
    // const transferAmount = Math.round((job.amount - job.platform_fee) * 100);
    // const transfer = await stripe.transfers.create({
    //   amount: transferAmount,
    //   currency: job.currency.toLowerCase(),
    //   destination: agency.stripe_account_id,
    //   metadata: {
    //     job_id: job.id,
    //     payment_intent_id: payment.stripe_payment_intent_id,
    //   },
    // });

    // Create payout record (for destination charges, transfer ID is the same as charge)
    await supabase.from("job_payouts").insert({
      job_id: job.id,
      stripe_transfer_id: payment.stripe_charge_id || payment.stripe_payment_intent_id,
      amount: job.amount - job.platform_fee,
      status: "paid", // With destination charges, it's already transferred
    });

    // Update job status
    await supabase
      .from("jobs")
      .update({
        status: "paid_out",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: job.business_id,
      event_type: "payout_completed",
      details: {
        amount: job.amount - job.platform_fee,
        agency_id: agency.id,
        agency_name: agency.name,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Funds released to agency",
        payout_amount: job.amount - job.platform_fee,
        currency: job.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error releasing funds:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
