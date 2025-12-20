// Supabase Edge Function: create-payment-intent
// Creates a Stripe PaymentIntent for a business to fund a job

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

    // Get job details with agency
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

    // Verify job is in unfunded status
    if (job.status !== "unfunded") {
      return new Response(JSON.stringify({ error: `Job cannot be funded in ${job.status} status` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agency has Stripe account
    const agency = job.agencies as any;
    if (!agency?.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Agency has not connected Stripe" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert amount to cents
    const amountInCents = Math.round(job.amount * 100);
    const platformFeeInCents = Math.round(job.platform_fee * 100);

    // Create PaymentIntent with destination charge (funds go to connected account)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: job.currency.toLowerCase(),
      // Use destination charge - platform collects full amount, then transfers
      transfer_data: {
        destination: agency.stripe_account_id,
      },
      // Platform fee is deducted from the transfer
      application_fee_amount: platformFeeInCents,
      metadata: {
        job_id: job.id,
        agency_id: job.agency_id,
        business_id: job.business_id,
        platform: "scalingad",
      },
      // Auto-capture when payment succeeds
      capture_method: "automatic",
    });

    // Create job_payments record
    await supabase.from("job_payments").insert({
      job_id: job.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: job.amount,
      status: "pending",
    });

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: job.business_id,
      event_type: "payment_intent_created",
      details: {
        payment_intent_id: paymentIntent.id,
        amount: job.amount,
        currency: job.currency,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: job.amount,
        currency: job.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
