// Supabase Edge Function: create-invoice-checkout
// Creates a Stripe Invoice for a job and returns a hosted invoice URL
// This provides proper invoicing, receipts, and documentation for disputes

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

async function getOrCreateCustomer(
  stripe: Stripe,
  supabase: any,
  user: any,
  profile: any
): Promise<string> {
  // If customer already exists, return it
  if (profile.stripe_customer_id) {
    try {
      const existingCustomer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!existingCustomer.deleted) {
        return profile.stripe_customer_id;
      }
    } catch (e) {
      console.log("Stripe customer not found, creating new one");
    }
  }

  // Create new customer
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

  // Save to profile
  await supabase
    .from("user_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", user.id);

  return customer.id;
}

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

    // Get request body
    const { job_id, success_url, cancel_url } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
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

    // Get job details with agency and proposal info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        business_id,
        agency_id,
        proposal_id,
        amount,
        currency,
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

    // Get or create Stripe Customer
    const customerId = await getOrCreateCustomer(stripe, supabase, user, profile);

    // Convert amount to cents - parse as float first since Supabase returns DECIMAL as string
    const amountValue = parseFloat(job.amount) || 0;
    const amountInCents = Math.round(amountValue * 100);
    
    console.log(`Creating invoice for job ${job.id}: amount=${job.amount}, parsed=${amountValue}, cents=${amountInCents}`);

    // Validate amount
    if (amountInCents <= 0) {
      return new Response(JSON.stringify({ error: "Job amount must be greater than 0" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IMPORTANT: Create Invoice FIRST (as draft), then add items, then finalize
    // This ensures line items are properly attached
    
    // Step 1: Create Invoice (draft)
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 0, // Due immediately
      auto_advance: false, // Don't auto-advance, we'll finalize manually
      metadata: {
        job_id: job.id,
        agency_id: job.agency_id,
        business_id: job.business_id,
        platform: "scalingad",
      },
      // Custom fields for the invoice PDF
      custom_fields: [
        { name: "Project", value: job.title || "Project Funding" },
        { name: "Agency", value: agency.name },
      ],
      // Transfer data for Connect
      transfer_data: {
        destination: agency.stripe_account_id,
      },
      // Footer
      footer: "Thank you for using ScalingAD. Funds will be held in escrow until work is approved.",
    });

    console.log(`Created draft invoice ${invoice.id}`);

    // Step 2: Create Invoice Item and attach to the invoice
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id, // Attach directly to the invoice!
      amount: amountInCents,
      currency: job.currency.toLowerCase(),
      description: `${job.title || "Project"} - ${agency.name}`,
      metadata: {
        job_id: job.id,
        agency_id: job.agency_id,
        proposal_id: job.proposal_id || "",
      },
    });

    console.log(`Added invoice item ${invoiceItem.id} with amount ${amountInCents} cents`);

    // Step 3: Finalize the invoice to generate the hosted page
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Store invoice info in job_payments
    await supabase.from("job_payments").insert({
      job_id: job.id,
      stripe_payment_intent_id: finalizedInvoice.payment_intent as string || invoice.id,
      amount: job.amount,
      status: "pending",
    });

    // Update job with invoice ID for reference
    await supabase
      .from("jobs")
      .update({ 
        stripe_invoice_id: invoice.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id);

    // Log to ledger
    await supabase.from("ledger_entries").insert({
      job_id: job.id,
      actor_id: job.business_id,
      event_type: "invoice_created",
      details: {
        invoice_id: invoice.id,
        invoice_number: finalizedInvoice.number,
        amount: job.amount,
        currency: job.currency,
        customer_id: customerId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_url: finalizedInvoice.hosted_invoice_url,
        invoice_pdf: finalizedInvoice.invoice_pdf,
        invoice_id: invoice.id,
        invoice_number: finalizedInvoice.number,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
