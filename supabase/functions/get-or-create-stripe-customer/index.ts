// Supabase Edge Function: get-or-create-stripe-customer
// Gets existing or creates new Stripe Customer for a user

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, user_id, name, company_name, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If customer already exists, return it
    if (profile.stripe_customer_id) {
      // Verify customer still exists in Stripe
      try {
        const existingCustomer = await stripe.customers.retrieve(profile.stripe_customer_id);
        if (!existingCustomer.deleted) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              customer_id: profile.stripe_customer_id,
              is_new: false 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      } catch (e) {
        // Customer doesn't exist in Stripe, will create new one
        console.log("Stripe customer not found, creating new one");
      }
    }

    // Create new Stripe Customer
    const customerName = profile.company_name || profile.name || "Customer";
    const customer = await stripe.customers.create({
      email: user.email,
      name: customerName,
      metadata: {
        supabase_user_id: user.id,
        supabase_profile_id: profile.id,
        platform: "scalingad",
      },
    });

    // Save customer ID to profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to save customer ID:", updateError);
      // Don't fail - customer was created in Stripe
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer_id: customer.id,
        is_new: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
