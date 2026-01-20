// Supabase Edge Function: create-stripe-login-link
// Creates a login link for a Standard Connect account to access the full Stripe Dashboard
// Standard accounts have full dashboard access (not Express dashboard)

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

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { agency_id } = await req.json();

    if (!agency_id) {
      return new Response(JSON.stringify({ error: "agency_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agency's Stripe account ID
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", agency_id)
      .single();

    if (agencyError || !agency || !agency.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Agency or Stripe account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the Stripe account status before creating login link
    // Standard accounts need to complete onboarding to access the dashboard
    const stripeAccount = await stripe.accounts.retrieve(agency.stripe_account_id);

    // Check if onboarding is complete
    if (!stripeAccount.details_submitted) {
      return new Response(
        JSON.stringify({
          error: "Stripe onboarding incomplete",
          message: "Please complete your Stripe onboarding before accessing the dashboard.",
          onboarding_complete: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check account type - must be Standard
    if (stripeAccount.type !== "standard") {
      return new Response(
        JSON.stringify({
          error: "Invalid account type",
          message: `This account is type "${stripeAccount.type}". Only Standard accounts are supported.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create login link for Standard account to access full Stripe Dashboard
    const loginLink = await stripe.accounts.createLoginLink(agency.stripe_account_id);

    return new Response(
      JSON.stringify({
        success: true,
        url: loginLink.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating login link:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
