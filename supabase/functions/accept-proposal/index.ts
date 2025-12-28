import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  proposalId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { proposalId }: RequestBody = await req.json();

    if (!proposalId) {
      throw new Error("Proposal ID is required");
    }

    // Fetch proposal with agency info
    const { data: proposal, error: proposalError } = await supabaseClient
      .from("proposals")
      .select(
        `
        *,
        agencies (
          stripe_account_id,
          stripe_onboarding_complete,
          stripe_payouts_enabled
        )
      `
      )
      .eq("id", proposalId)
      .eq("business_id", user.id)
      .eq("status", "sent")
      .single();

    if (proposalError || !proposal) {
      throw new Error("Proposal not found or already processed");
    }

    // Verify agency has Stripe account
    if (
      !proposal.agencies?.stripe_account_id ||
      !proposal.agencies?.stripe_onboarding_complete
    ) {
      throw new Error("Agency has not completed Stripe onboarding");
    }

    // Update proposal status to accepted
    const { error: updateProposalError } = await supabaseClient
      .from("proposals")
      .update({ status: "accepted" })
      .eq("id", proposalId);

    if (updateProposalError) {
      throw updateProposalError;
    }

    // Create job from proposal
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .insert({
        deal_id: proposal.deal_id,
        business_id: proposal.business_id,
        agency_id: proposal.agency_id,
        proposal_id: proposal.id,
        source: "proposal",
        title: proposal.title,
        description: proposal.description,
        amount: proposal.amount,
        currency: proposal.currency,
        platform_fee: proposal.platform_fee,
        status: "pending", // Agency needs to accept job
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Create ledger entry
    await supabaseClient.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: user.id,
      event_type: "job_created_from_proposal",
      details: {
        proposal_id: proposalId,
        amount: proposal.amount,
      },
    });

    // Mark proposal as converted
    await supabaseClient
      .from("proposals")
      .update({ status: "converted" })
      .eq("id", proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        message: "Proposal accepted and job created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error accepting proposal:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
