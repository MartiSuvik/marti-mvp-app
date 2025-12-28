// Supabase Edge Function: verify-stripe-account
// Verifies Stripe Connect account status and updates database
// Called after agency completes Stripe onboarding to immediately sync status

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
      .select("id, stripe_account_id")
      .eq("id", agency_id)
      .single();

    if (agencyError || !agency) {
      return new Response(JSON.stringify({ error: "Agency not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!agency.stripe_account_id) {
      return new Response(JSON.stringify({ error: "No Stripe account ID found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch account status from Stripe API
    const account = await stripe.accounts.retrieve(agency.stripe_account_id);

    // Check account capabilities and details
    const detailsSubmitted = account.details_submitted || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const chargesEnabled = account.charges_enabled || false;

    // Update database with latest status
    const { error: updateError } = await supabase
      .from("agencies")
      .update({
        stripe_onboarding_complete: detailsSubmitted,
        stripe_payouts_enabled: payoutsEnabled && chargesEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agency_id);

    if (updateError) {
      console.error("Error updating agency:", updateError);
      throw new Error("Failed to update agency status");
    }

    return new Response(
      JSON.stringify({
        success: true,
        stripe_account_id: agency.stripe_account_id,
        details_submitted: detailsSubmitted,
        payouts_enabled: payoutsEnabled,
        charges_enabled: chargesEnabled,
        onboarding_complete: detailsSubmitted,
        ready_for_payouts: payoutsEnabled && chargesEnabled,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error verifying Stripe account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
