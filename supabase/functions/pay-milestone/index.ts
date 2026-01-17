// Supabase Edge Function: pay-milestone
// Creates a Stripe Checkout Session for a single milestone using DIRECT CHARGES
// Payment goes directly to the agency's connected Stripe account
// Platform NEVER holds funds - this is the core of the direct payment model

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

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const { milestone_id, success_url, cancel_url } = await req.json();

    if (!milestone_id) {
      return new Response(JSON.stringify({ error: "milestone_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get milestone with job and agency details
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select(`
        id,
        job_id,
        title,
        description,
        amount,
        currency,
        status,
        order_index,
        jobs (
          id,
          title,
          business_id,
          agency_id,
          status,
          agencies (
            id,
            name,
            stripe_account_id,
            stripe_onboarding_complete,
            stripe_payouts_enabled
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
    const agency = job?.agencies as any;

    // Verify the user is the business owner
    if (job.business_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized to pay for this milestone" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify milestone is in approved status (business has approved the work)
    if (milestone.status !== "approved") {
      return new Response(JSON.stringify({ 
        error: `Milestone must be approved before payment. Current status: ${milestone.status}` 
      }), {
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

    // Verify agency has completed Stripe onboarding
    if (!agency.stripe_onboarding_complete) {
      return new Response(JSON.stringify({ 
        error: "Agency has not completed Stripe onboarding. Please contact the agency." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert amount to cents
    const amountInCents = Math.round(milestone.amount * 100);

    // Determine origin for redirect URLs
    const origin = req.headers.get("origin") || "https://scalingad.com";

    // =================================================================
    // DIRECT CHARGE: Create Checkout Session ON the agency's account
    // Using stripeAccount parameter - funds go DIRECTLY to agency
    // Platform NEVER touches the money
    // =================================================================
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: milestone.currency.toLowerCase(),
              product_data: {
                name: `Milestone: ${milestone.title}`,
                description: milestone.description 
                  ? milestone.description.substring(0, 500) 
                  : `Milestone payment for ${job.title}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        // NO application_fee_amount - platform doesn't take fees
        // Metadata for tracking
        payment_intent_data: {
          metadata: {
            milestone_id: milestone.id,
            job_id: job.id,
            agency_id: job.agency_id,
            business_id: job.business_id,
            platform: "scalingad",
            payment_type: "milestone_payment",
          },
        },
        metadata: {
          milestone_id: milestone.id,
          job_id: job.id,
          agency_id: job.agency_id,
          business_id: job.business_id,
          payment_type: "milestone_payment",
        },
        success_url: success_url || `${origin}/brand/jobs/${job.id}?milestone_payment=success&milestone_id=${milestone.id}`,
        cancel_url: cancel_url || `${origin}/brand/jobs/${job.id}?milestone_payment=cancelled&milestone_id=${milestone.id}`,
      },
      {
        // CRITICAL: This header makes it a DIRECT CHARGE on the connected account
        stripeAccount: agency.stripe_account_id,
      }
    );

    // Update milestone with checkout session ID
    await supabase
      .from("milestones")
      .update({ 
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestone.id);

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: job.business_id,
      event_type: "milestone_direct_charge_checkout_created",
      details: {
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        session_id: session.id,
        amount: milestone.amount,
        currency: milestone.currency,
        agency_stripe_account_id: agency.stripe_account_id,
        payment_type: "milestone_payment",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        milestone_id: milestone.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating milestone checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
