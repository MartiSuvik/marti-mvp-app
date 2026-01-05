// Supabase Edge Function: stripe-webhook
// Handles incoming Stripe webhook events for Connect payments and Platform invoices

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

// Helper function to verify webhook with multiple secrets
function verifyWebhookSignature(body: string, signature: string): Stripe.Event | null {
  // Try Connect webhook secret first (for account.* and transfer.* events)
  const connectSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  // Try Platform webhook secret second (for invoice.* events)
  const platformSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_PLATFORM") || "";
  
  const secrets = [connectSecret, platformSecret].filter(Boolean);
  
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      // Try next secret
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
    const event = verifyWebhookSignature(body, signature);
    
    if (!event) {
      console.error("Webhook signature verification failed with all secrets");
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // Checkout Session completed
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, session);
        break;
      }

      // Payment Intent events
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(supabase, paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(supabase, paymentIntent);
        break;
      }

      // Transfer events (platform → agency)
      case "transfer.paid": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferPaid(supabase, transfer);
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferFailed(supabase, transfer);
        break;
      }

      // Connected account events
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

      // Refund events
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabase, charge);
        break;
      }

      // Invoice events (for Stripe Invoicing)
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      case "invoice.voided": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceVoided(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log all events to ledger
    await logToLedger(supabase, event);

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

// Handler functions

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const jobId = session.metadata?.job_id;
  if (!jobId) {
    console.log("No job_id in checkout session metadata");
    return;
  }

  // If payment was successful, update the job status
  if (session.payment_status === "paid") {
    // Update job_payments record with payment intent ID
    if (session.payment_intent) {
      await supabase
        .from("job_payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("job_id", jobId);
    }

    // Update job status to funded
    await supabase
      .from("jobs")
      .update({
        status: "funded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("status", "unfunded"); // Only update if still unfunded

    console.log(`Checkout completed for job ${jobId}`);
  }
}

async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const jobId = paymentIntent.metadata?.job_id;
  if (!jobId) {
    console.log("No job_id in payment intent metadata");
    return;
  }

  // Update job_payments record
  await supabase
    .from("job_payments")
    .update({
      status: "succeeded",
      stripe_charge_id: paymentIntent.latest_charge as string,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  // Update job status to funded
  await supabase
    .from("jobs")
    .update({
      status: "funded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  console.log(`Job ${jobId} funded successfully`);
}

async function handlePaymentIntentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const jobId = paymentIntent.metadata?.job_id;
  if (!jobId) return;

  // Update job_payments record
  await supabase
    .from("job_payments")
    .update({ status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  console.log(`Payment failed for job ${jobId}`);
}

async function handleTransferPaid(supabase: any, transfer: Stripe.Transfer) {
  const jobId = transfer.metadata?.job_id;
  if (!jobId) return;

  // Update job_payouts record
  await supabase
    .from("job_payouts")
    .update({ status: "paid" })
    .eq("stripe_transfer_id", transfer.id);

  // Update job status to paid_out
  await supabase
    .from("jobs")
    .update({
      status: "paid_out",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  console.log(`Payout completed for job ${jobId}`);
}

async function handleTransferFailed(supabase: any, transfer: Stripe.Transfer) {
  const jobId = transfer.metadata?.job_id;
  if (!jobId) return;

  await supabase
    .from("job_payouts")
    .update({ status: "failed" })
    .eq("stripe_transfer_id", transfer.id);

  console.log(`Transfer failed for job ${jobId}`);
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

async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Find the job via payment
  const { data: payment } = await supabase
    .from("job_payments")
    .select("job_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (payment?.job_id) {
    // Update payment status
    await supabase
      .from("job_payments")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", paymentIntentId);

    // Update job status
    await supabase
      .from("jobs")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.job_id);

    console.log(`Charge refunded for job ${payment.job_id}`);
  }
}

// Invoice event handlers for Stripe Invoicing

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  const jobId = invoice.metadata?.job_id;
  
  // Try to find job by invoice ID if not in metadata
  let actualJobId = jobId;
  if (!actualJobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("stripe_invoice_id", invoice.id)
      .single();
    actualJobId = job?.id;
  }

  if (!actualJobId) {
    console.log("No job found for invoice:", invoice.id);
    return;
  }

  // Update job_payments record with payment intent
  if (invoice.payment_intent) {
    await supabase
      .from("job_payments")
      .update({
        status: "succeeded",
        stripe_payment_intent_id: invoice.payment_intent as string,
      })
      .eq("job_id", actualJobId);
  }

  // Update job status to funded
  await supabase
    .from("jobs")
    .update({
      status: "funded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", actualJobId)
    .eq("status", "unfunded"); // Only update if still unfunded

  // Log to ledger
  await supabase.from("ledger_entries").insert({
    job_id: actualJobId,
    event_type: "invoice_paid",
    details: {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      payment_intent: invoice.payment_intent,
      customer_id: invoice.customer,
    },
  });

  console.log(`Invoice ${invoice.id} paid for job ${actualJobId}. Amount: ${invoice.amount_paid / 100} ${invoice.currency?.toUpperCase()}`);
}

async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const jobId = invoice.metadata?.job_id;
  
  // Try to find job by invoice ID
  let actualJobId = jobId;
  if (!actualJobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("stripe_invoice_id", invoice.id)
      .single();
    actualJobId = job?.id;
  }

  if (!actualJobId) {
    console.log("No job found for failed invoice:", invoice.id);
    return;
  }

  // Update job_payments record
  await supabase
    .from("job_payments")
    .update({ status: "failed" })
    .eq("job_id", actualJobId);

  // Log to ledger
  await supabase.from("ledger_entries").insert({
    job_id: actualJobId,
    event_type: "invoice_payment_failed",
    details: {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt,
    },
  });

  console.log(`Invoice payment failed for job ${actualJobId}`);
}

async function handleInvoiceVoided(supabase: any, invoice: Stripe.Invoice) {
  const jobId = invoice.metadata?.job_id;
  
  let actualJobId = jobId;
  if (!actualJobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("stripe_invoice_id", invoice.id)
      .single();
    actualJobId = job?.id;
  }

  if (actualJobId) {
    // Update job_payments
    await supabase
      .from("job_payments")
      .update({ status: "cancelled" })
      .eq("job_id", actualJobId);

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: actualJobId,
      event_type: "invoice_voided",
      details: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
      },
    });

    console.log(`Invoice voided for job ${actualJobId}`);
  }
}

async function logToLedger(supabase: any, event: Stripe.Event) {
  // Extract job_id from event if available
  let jobId = null;
  const data = event.data.object as any;
  
  if (data.metadata?.job_id) {
    jobId = data.metadata.job_id;
  }

  await supabase.from("ledger_entries").insert({
    job_id: jobId,
    event_type: event.type,
    details: {
      stripe_event_id: event.id,
      object_id: data.id,
      livemode: event.livemode,
    },
  });
}
