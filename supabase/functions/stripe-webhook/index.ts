// Supabase Edge Function: stripe-webhook
// Handles incoming Stripe webhook events for DIRECT CHARGES model
// 
// DIRECT CHARGES ARCHITECTURE:
// - Payments are created ON the connected account (agency)
// - Events fire on the connected account AND platform (via Connect webhooks)
// - Platform never holds funds, only tracks payment status
// - No transfer events needed (no platform-to-agency transfers)

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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper function to verify webhook with multiple secrets (async for Deno)
async function verifyWebhookSignature(body: string, signature: string): Promise<Stripe.Event | null> {
  // Connect webhook secret handles events from connected accounts
  const connectSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  // Platform secret for account-level events (optional fallback)
  const platformSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_PLATFORM") || "";
  
  const secrets = [connectSecret, platformSecret].filter(Boolean);
  
  for (const secret of secrets) {
    try {
      // Use async version for Deno/Supabase Edge Functions
      const event = await stripe.webhooks.constructEventAsync(body, signature, secret);
      return event;
    } catch {
      continue;
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      console.error("Missing signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify the webhook signature with both secrets
    const event = await verifyWebhookSignature(body, signature);
    
    if (!event) {
      console.error("Webhook signature verification failed");
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For Connect webhooks, event.account contains the connected account ID
    const connectedAccountId = (event as any).account || null;
    console.log(`Processing event: ${event.type}${connectedAccountId ? ` (account: ${connectedAccountId})` : ''}`);

    // Handle different event types
    switch (event.type) {
      // =================================================================
      // DIRECT CHARGE PAYMENT EVENTS
      // These fire on the connected account when a direct charge completes
      // =================================================================
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, session, connectedAccountId);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(supabase, paymentIntent, connectedAccountId);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(supabase, paymentIntent);
        break;
      }

      // =================================================================
      // CONNECTED ACCOUNT EVENTS
      // Account status changes for agencies
      // =================================================================

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(supabase, account);
        break;
      }

      case "account.application.deauthorized": {
        const account = event.data.object as Stripe.Account;
        await handleAccountDeauthorized(supabase, account);
        break;
      }

      // =================================================================
      // DISPUTE EVENTS (Direct charges = agency handles disputes)
      // We track for visibility but agency is responsible
      // =================================================================

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(supabase, dispute, connectedAccountId);
        break;
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeClosed(supabase, dispute, connectedAccountId);
        break;
      }

      // =================================================================
      // REFUND EVENTS
      // Direct charges = agency processes refunds
      // =================================================================

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabase, charge, connectedAccountId);
        break;
      }

      // =================================================================
      // DEPRECATED EVENTS (No longer used in direct charge model)
      // Kept for logging only - transfers don't exist in this model
      // =================================================================

      case "transfer.paid":
      case "transfer.failed": {
        console.log(`DEPRECATED: ${event.type} - Direct charge model does not use transfers`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log all events to ledger
    await logToLedger(supabase, event, connectedAccountId);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// =================================================================
// HANDLER FUNCTIONS FOR DIRECT CHARGES
// =================================================================

async function handleCheckoutSessionCompleted(
  supabase: any, 
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null
) {
  const paymentType = session.metadata?.payment_type;
  const jobId = session.metadata?.job_id;
  const milestoneId = session.metadata?.milestone_id;

  if (!jobId) {
    console.log("No job_id in checkout session metadata");
    return;
  }

  // Only process paid sessions
  if (session.payment_status !== "paid") {
    console.log(`Checkout session ${session.id} not paid yet: ${session.payment_status}`);
    return;
  }

  // Handle based on payment type
  if (paymentType === "milestone_payment" && milestoneId) {
    // Milestone payment completed
    await handleMilestonePaymentCompleted(supabase, session, milestoneId, jobId);
  } else {
    // Full job payment completed
    await handleJobPaymentCompleted(supabase, session, jobId);
  }
}

async function handleMilestonePaymentCompleted(
  supabase: any,
  session: Stripe.Checkout.Session,
  milestoneId: string,
  jobId: string
) {
  const paymentIntentId = session.payment_intent as string;

  // Update milestone to paid
  await supabase
    .from("milestones")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  // Update job's total released amount
  const { data: milestone } = await supabase
    .from("milestones")
    .select("amount")
    .eq("id", milestoneId)
    .single();

  if (milestone) {
    // Increment total_released on job
    const { data: job } = await supabase
      .from("jobs")
      .select("total_released")
      .eq("id", jobId)
      .single();

    const newTotal = (job?.total_released || 0) + milestone.amount;
    
    await supabase
      .from("jobs")
      .update({
        total_released: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }

  // Check if all milestones are now paid
  const { data: allMilestones } = await supabase
    .from("milestones")
    .select("status")
    .eq("job_id", jobId);

  const allPaid = allMilestones?.every((m: any) => m.status === "paid");
  
  if (allPaid) {
    // Update job to paid_out
    await supabase
      .from("jobs")
      .update({
        status: "paid_out",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    
    console.log(`All milestones paid - job ${jobId} marked as paid_out`);
  }

  console.log(`Milestone ${milestoneId} payment completed for job ${jobId}`);
}

async function handleJobPaymentCompleted(
  supabase: any,
  session: Stripe.Checkout.Session,
  jobId: string
) {
  const paymentIntentId = session.payment_intent as string;

  // Create/update job_payments record
  await supabase
    .from("job_payments")
    .upsert({
      job_id: jobId,
      stripe_payment_intent_id: paymentIntentId,
      amount: (session.amount_total || 0) / 100,
      status: "succeeded",
    }, { onConflict: "job_id" });

  // Update job status to paid_out (direct charge = immediate payment)
  await supabase
    .from("jobs")
    .update({
      status: "paid_out",
      total_released: (session.amount_total || 0) / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  console.log(`Job ${jobId} payment completed via direct charge`);
}

async function handlePaymentIntentSucceeded(
  supabase: any, 
  paymentIntent: Stripe.PaymentIntent,
  connectedAccountId: string | null
) {
  const paymentType = paymentIntent.metadata?.payment_type;
  const jobId = paymentIntent.metadata?.job_id;
  const milestoneId = paymentIntent.metadata?.milestone_id;

  if (!jobId) {
    console.log("No job_id in payment intent metadata");
    return;
  }

  // Get charge ID
  const chargeId = paymentIntent.latest_charge as string;

  if (paymentType === "milestone_payment" && milestoneId) {
    // Update milestone
    await supabase
      .from("milestones")
      .update({
        status: "paid",
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: chargeId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestoneId);

    console.log(`Milestone ${milestoneId} paid via PaymentIntent`);
  } else {
    // Update job_payments record
    await supabase
      .from("job_payments")
      .upsert({
        job_id: jobId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: chargeId,
        amount: paymentIntent.amount / 100,
        status: "succeeded",
      }, { onConflict: "stripe_payment_intent_id" });

    // Update job status
    await supabase
      .from("jobs")
      .update({
        status: "paid_out",
        total_released: paymentIntent.amount / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`Job ${jobId} payment succeeded via direct charge`);
  }
}

async function handlePaymentIntentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const jobId = paymentIntent.metadata?.job_id;
  const milestoneId = paymentIntent.metadata?.milestone_id;

  if (milestoneId) {
    // Log failure for milestone
    await supabase.from("ledger_entries").insert({
      job_id: jobId,
      event_type: "milestone_payment_failed",
      details: {
        milestone_id: milestoneId,
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      },
    });
    console.log(`Milestone ${milestoneId} payment failed`);
  } else if (jobId) {
    // Update job_payments record
    await supabase
      .from("job_payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", paymentIntent.id);
    
    console.log(`Payment failed for job ${jobId}`);
  }
}

async function handleAccountUpdated(supabase: any, account: Stripe.Account) {
  // Update agency Stripe status
  const payoutsEnabled = account.payouts_enabled || false;
  const chargesEnabled = account.charges_enabled || false;
  const detailsSubmitted = account.details_submitted || false;

  await supabase
    .from("agencies")
    .update({
      stripe_onboarding_complete: detailsSubmitted,
      stripe_payouts_enabled: payoutsEnabled && chargesEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);

  console.log(`Account ${account.id} updated: payouts=${payoutsEnabled}, charges=${chargesEnabled}`);
}

async function handleAccountDeauthorized(supabase: any, account: Stripe.Account) {
  // Agency disconnected their Stripe account
  await supabase
    .from("agencies")
    .update({
      stripe_account_id: null,
      stripe_onboarding_complete: false,
      stripe_payouts_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);

  console.log(`Account ${account.id} deauthorized`);
}

// =================================================================
// DISPUTE HANDLERS (Direct charges = agency responsibility)
// =================================================================

async function handleDisputeCreated(
  supabase: any, 
  dispute: Stripe.Dispute,
  connectedAccountId: string | null
) {
  // Find the job via the charge metadata
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  
  // Log dispute for visibility - agency handles resolution
  await supabase.from("ledger_entries").insert({
    event_type: "dispute_created",
    details: {
      dispute_id: dispute.id,
      charge_id: chargeId,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      connected_account_id: connectedAccountId,
      // Note: With direct charges, the agency is responsible for disputes
      liability: "agency",
    },
  });

  console.log(`Dispute ${dispute.id} created on account ${connectedAccountId} - agency responsible`);
}

async function handleDisputeClosed(
  supabase: any, 
  dispute: Stripe.Dispute,
  connectedAccountId: string | null
) {
  await supabase.from("ledger_entries").insert({
    event_type: "dispute_closed",
    details: {
      dispute_id: dispute.id,
      status: dispute.status,
      connected_account_id: connectedAccountId,
    },
  });

  console.log(`Dispute ${dispute.id} closed with status: ${dispute.status}`);
}

async function handleChargeRefunded(
  supabase: any, 
  charge: Stripe.Charge,
  connectedAccountId: string | null
) {
  // With direct charges, refunds are processed by the agency
  // We just track for visibility
  
  const paymentIntentId = charge.payment_intent as string;
  const metadata = charge.metadata || {};
  const jobId = metadata.job_id;
  const milestoneId = metadata.milestone_id;

  if (milestoneId) {
    // Milestone refund - update milestone status
    await supabase
      .from("milestones")
      .update({
        status: "revision", // Or create a "refunded" status if needed
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId);

    await supabase.from("ledger_entries").insert({
      job_id: jobId,
      event_type: "milestone_refunded",
      details: {
        milestone_id: milestoneId,
        charge_id: charge.id,
        amount_refunded: charge.amount_refunded,
        connected_account_id: connectedAccountId,
      },
    });

    console.log(`Milestone ${milestoneId} refunded`);
  } else if (jobId) {
    // Full job refund
    await supabase
      .from("job_payments")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", paymentIntentId);

    await supabase.from("ledger_entries").insert({
      job_id: jobId,
      event_type: "job_refunded",
      details: {
        charge_id: charge.id,
        amount_refunded: charge.amount_refunded,
        connected_account_id: connectedAccountId,
      },
    });

    console.log(`Job ${jobId} payment refunded`);
  }
}

// =================================================================
// LEDGER LOGGING
// =================================================================

async function logToLedger(
  supabase: any, 
  event: Stripe.Event,
  connectedAccountId: string | null
) {
  // Extract job_id from event if available
  let jobId = null;
  const data = event.data.object as any;
  
  if (data.metadata?.job_id) {
    jobId = data.metadata.job_id;
  }

  await supabase.from("ledger_entries").insert({
    job_id: jobId,
    event_type: `stripe_${event.type}`,
    details: {
      stripe_event_id: event.id,
      object_id: data.id,
      livemode: event.livemode,
      connected_account_id: connectedAccountId,
    },
  });
}
