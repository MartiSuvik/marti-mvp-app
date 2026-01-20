// Supabase Edge Function: create-stripe-login-link
// For Standard accounts: Returns the direct Stripe Dashboard URL (agencies log in with their own credentials)
// For Express accounts: Creates a login link via API
// ScalingAD uses Standard accounts - agencies access dashboard.stripe.com directly

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { agency_id } = await req.json();

    if (!agency_id) {
      return new Response(JSON.stringify({ error: "agency_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("stripe_account_id")
      .eq("id", agency_id)
      .single();

    if (agencyError || !agency || !agency.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Agency or Stripe account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeAccount = await stripe.accounts.retrieve(agency.stripe_account_id);

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

    // Standard accounts: Return direct dashboard URL (agencies log in with their own Stripe credentials)
    if (stripeAccount.type === "standard") {
      return new Response(
        JSON.stringify({
          success: true,
          url: "https://dashboard.stripe.com",
          account_type: "standard",
          message: "Standard accounts access the Stripe Dashboard directly. Log in with your Stripe credentials.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Express accounts: Create login link via API
    if (stripeAccount.type === "express") {
      const loginLink = await stripe.accounts.createLoginLink(agency.stripe_account_id);
      return new Response(
        JSON.stringify({
          success: true,
          url: loginLink.url,
          account_type: "express",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Unsupported account type",
        message: `Account type "${stripeAccount.type}" is not supported.`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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