// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for a business to fund a job

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
    const { job_id, success_url, cancel_url } = await req.json();

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
        title,
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

    // Verify job belongs to this user
    if (job.business_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized to fund this job" }), {
        status: 403,
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
      return new Response(JSON.stringify({ error: "Agency has not connected Stripe account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert amount to cents
    const amountInCents = Math.round(job.amount * 100);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: job.currency.toLowerCase(),
            product_data: {
              name: job.title || "Project Funding",
              description: `Fund project with ${agency.name}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Use destination charge - funds go to connected account
        transfer_data: {
          destination: agency.stripe_account_id,
        },
        metadata: {
          job_id: job.id,
          agency_id: job.agency_id,
          business_id: job.business_id,
          platform: "scalingad",
        },
      },
      metadata: {
        job_id: job.id,
        agency_id: job.agency_id,
        business_id: job.business_id,
      },
      success_url: success_url || `${req.headers.get("origin")}/jobs/${job.id}?payment=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/jobs/${job.id}?payment=cancelled`,
    });

    // Create job_payments record (pending)
    await supabase.from("job_payments").insert({
      job_id: job.id,
      stripe_payment_intent_id: session.payment_intent as string || session.id,
      amount: job.amount,
      status: "pending",
    });

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: job.business_id,
      event_type: "checkout_session_created",
      details: {
        session_id: session.id,
        amount: job.amount,
        currency: job.currency,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
