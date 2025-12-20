// Supabase Edge Function: create-connect-account
// Creates a Stripe Connect account for an agency and returns the onboarding link

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

    // Create Supabase client with user's JWT
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get request body
    const { agency_id, return_url, refresh_url } = await req.json();

    if (!agency_id) {
      return new Response(JSON.stringify({ error: "agency_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agency details
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, stripe_account_id")
      .eq("id", agency_id)
      .single();

    if (agencyError || !agency) {
      return new Response(JSON.stringify({ error: "Agency not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let stripeAccountId = agency.stripe_account_id;

    // Create Stripe Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express", // Using Express for simplest onboarding
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        metadata: {
          agency_id: agency_id,
          platform: "scalingad",
        },
      });

      stripeAccountId = account.id;

      // Save the Stripe account ID to the agency
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency_id);

      if (updateError) {
        console.error("Error updating agency:", updateError);
      }
    }

    // Create the account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url || `${req.headers.get("origin")}/stripe-onboarding?status=refresh`,
      return_url: return_url || `${req.headers.get("origin")}/stripe-onboarding?status=success`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        success: true,
        stripe_account_id: stripeAccountId,
        onboarding_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating connect account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
