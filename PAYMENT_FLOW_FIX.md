# Payment Flow Architecture Fix

> **Status:** Critical  
> **Date:** January 7, 2026  
> **Severity:** Blocking - Milestone releases fail

---

## Executive Summary

Your current payment flow mixes **destination charges** with an **escrow + milestone release model**. That is a hard architectural contradiction. Stripe is doing exactly what you told it to do, not what you want.

**Result:** Money leaves the platform immediately, then you try to release money that no longer exists. Hence the "insufficient funds" failure.

This is not a bug. This is a model mismatch.

---

## Core Architectural Fault

### Current Flow (Broken)

```
┌─────────────┐     Invoice Paid      ┌──────────────┐     Auto-Transfer     ┌─────────────────┐
│   Business  │ ────────────────────▶ │   Stripe     │ ────────────────────▶ │     Agency      │
│   pays $X   │                       │   Platform   │                       │  (receives $X)  │
└─────────────┘                       │  balance: $0 │                       └─────────────────┘
                                      └──────────────┘
                                            │
                                            │  Later: "Release Milestone"
                                            ▼
                                      ┌──────────────┐
                                      │   FAILURE    │
                                      │ No funds to  │
                                      │   transfer   │
                                      └──────────────┘
```

### What You Do

| Step | Action | Result |
|------|--------|--------|
| 1 | `create-invoice-checkout` creates invoice with `transfer_data.destination` | ✅ Invoice created |
| 2 | Business pays invoice | ✅ Payment succeeds |
| 3 | Stripe auto-transfers 100% to agency | ⚠️ Platform balance = $0 |
| 4 | `release-milestone` tries to transfer | ❌ **FAIL**: No funds |

**Root Cause:** Destination charges and escrow-style milestone releases **cannot coexist**.

Stripe does not support "auto-transfer now, pretend escrow later".

---

## Correct Mental Model

You must choose **one**:

### Option A: Escrow + Milestones ✅ (Recommended)

```
┌─────────────┐     Invoice Paid      ┌──────────────┐     Per-Milestone     ┌─────────────────┐
│   Business  │ ────────────────────▶ │   Stripe     │ ────────────────────▶ │     Agency      │
│   pays $X   │                       │   Platform   │    transfer.create    │  (milestone $)  │
└─────────────┘                       │  holds funds │                       └─────────────────┘
                                      └──────────────┘
```

- No `transfer_data` on payment
- Funds land on platform balance
- Release per milestone via `stripe.transfers.create`
- Platform acts as temporary custodian
- Use `source_transaction` to link transfer to original charge

### Option B: Immediate Payout (No Milestones)

- Keep destination charges
- Remove milestone release entirely
- All money goes to agency on payment
- This is **NOT** escrow

---

## File-by-File Changes Required

### 1. `supabase/functions/create-invoice-checkout/index.ts`

**Problem:**
- Sets `transfer_data` during invoice creation
- Converts payment into immediate destination charge
- Funds never sit on platform balance
- Milestone logic downstream is dead on arrival

**Current Code (WRONG):**
```typescript
const invoice = await stripe.invoices.create({
  customer: customerId,
  collection_method: "send_invoice",
  // ...
  transfer_data: {                    // ❌ REMOVE THIS
    destination: agency.stripe_account_id,
  },
});
```

**Fixed Code:**
```typescript
const invoice = await stripe.invoices.create({
  customer: customerId,
  collection_method: "send_invoice",
  // ...
  // NO transfer_data - funds stay on platform
  // application_fee handled differently for escrow model
});
```

**This is the single most important fix.**

---

### 2. `supabase/functions/stripe-webhook/index.ts`

**Problem:**
- Relies on `invoice.charge` which can be `null`
- `release-milestone` depends on valid `source_transaction`
- If you store wrong charge ID, transfers fail even after fixing escrow

**Current Code (UNRELIABLE):**
```typescript
stripe_charge_id: invoice.charge as string,
```

**Fixed Code:**
```typescript
// Get charge ID reliably from payment intent
let chargeId: string | null = null;

if (invoice.charge) {
  chargeId = typeof invoice.charge === 'string' 
    ? invoice.charge 
    : invoice.charge.id;
} else if (invoice.payment_intent) {
  const piId = typeof invoice.payment_intent === 'string' 
    ? invoice.payment_intent 
    : invoice.payment_intent.id;
  
  const paymentIntent = await stripe.paymentIntents.retrieve(piId, {
    expand: ['latest_charge']
  });
  
  if (paymentIntent.latest_charge) {
    chargeId = typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge.id;
  }
}
```

---

### 3. `supabase/functions/release-milestone/index.ts`

**What's Actually Fine:**
- Transfer logic is structurally correct
- Using `source_transaction` is the right approach

**Why It Fails Today:**
- Platform balance is empty because of destination charges
- Stripe error is expected

**After Fix:**
Once funds are held on platform (no `transfer_data`), this function works correctly:

```typescript
const transfer = await stripe.transfers.create({
  amount: amountInCents,
  currency: milestone.currency.toLowerCase(),
  destination: agency.stripe_account_id,
  source_transaction: chargeId,  // Links to original payment
  metadata: { milestone_id, job_id },
});
```

---

### 4. Database Schema

**Observations:**
- `milestones` table is conceptually correct
- `stripe_invoice_id` exists and is appropriate
- Status enums are reasonable

**Missing Invariants (should enforce):**
- Job must be `FUNDED` before milestone release
- Total released ≤ total paid
- These should be enforced at DB or service layer, not just UI

---

### 5. Frontend (`JobDetail.tsx`, `ProjectDetail.tsx`)

**Issue:**
- UI assumes milestone funding implies releasable funds
- Backend reality contradicts that assumption

**After Fix:**
- UI logic becomes valid
- Currently it's lying to the user because backend model is broken

---

## Minimal Fix Path

| Step | File | Change | Status |
|------|------|--------|--------|
| 1 | `create-invoice-checkout/index.ts` | Remove `transfer_data` block | ✅ Done |
| 2 | `create-invoice-checkout/index.ts` | Optionally add `application_fee_amount` for platform cut | ⏳ Later |
| 3 | `stripe-webhook/index.ts` | Fix charge ID extraction from payment intent | ✅ Done |
| 4 | `release-milestone/index.ts` | Verify it uses stored charge ID (should already work) | ✅ Ready |
| 5 | Deploy | `supabase functions deploy` all three functions | ✅ Done |
| 6 | Test | Create $5000 test job, pay, release milestone | ⏳ Pending |

---

## Platform Fee Consideration

When using escrow model, you should add an application fee to cover:
- Stripe processing fees (~2.9% + $0.30)
- Platform commission (your cut)

**Example for 10% platform fee:**
```typescript
const platformFeePercent = 0.10; // 10%
const applicationFee = Math.round(jobAmount * platformFeePercent * 100); // in cents

await stripe.invoiceItems.create({
  customer: customerId,
  invoice: invoice.id,
  amount: jobAmountCents,
  currency: 'usd',
  description: `Job: ${job.title}`,
});

// When finalizing, the application_fee_amount is set on payment intent
// For invoices, you handle this differently - fees come from platform balance
```

**Note:** With escrow model, Stripe fees come from your platform balance when you create transfers. Factor this into your pricing.

---

## Test Checklist

After implementing fixes:

- [ ] Create test job with milestones ($5000 total, split into 2-3 milestones)
- [ ] Fund job using test card `4242 4242 4242 4242`
- [ ] Verify webhook fires and job status → `funded`
- [ ] Verify `job_payments.stripe_charge_id` is populated
- [ ] Check Stripe Dashboard: funds should be on **platform** balance, not agency
- [ ] Approve milestone in UI
- [ ] Click "Release Payment" 
- [ ] Verify transfer succeeds
- [ ] Verify milestone status → `paid`
- [ ] Verify agency receives funds in connected account
- [ ] Repeat for remaining milestones
- [ ] Verify job status → `paid_out` when all milestones released

---

## One Final Note

Your architecture is *conceptually sound*.  
Your implementation violated Stripe's contract semantics.

This is not a Stripe problem.  
This is a "payments are state machines, not vibes" problem.

**Fix the model, the code will stop fighting you.**
