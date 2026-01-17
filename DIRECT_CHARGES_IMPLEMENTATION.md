# ScalingAD Direct Charges Implementation Plan

## Overview

Rebuilding the payment flow from **escrow/transfer model** to **Stripe Direct Charges**.

**Key Principle:** The platform never holds funds. All payments go directly to agency accounts. ScalingAD only orchestrates workflow.

---

## Non-Negotiable Constraints

- ❌ Platform must NOT hold funds
- ❌ Platform must NOT escrow
- ❌ Platform must NOT release money
- ❌ No transfers, no `source_transaction`, no destination charges
- ✅ All payments are **direct charges** to agency connected accounts
- ✅ Platform only coordinates workflow and payment initiation
- ✅ Stripe Standard Connected Accounts only
- ✅ No application fees (platform monetizes separately)

---

## Payment Model

| Actor | Role |
|-------|------|
| **Brand** | Pays per milestone directly to agency |
| **Agency** | Receives funds directly, pays Stripe fees, handles disputes |
| **Platform (ScalingAD)** | Coordinates workflow, never touches money |
| **Stripe** | Handles payment, fees, disputes, payouts |

---

## New Payment Flow

```
┌─────────────┐                    ┌─────────────────┐
│   Brand     │───── Pays ────────▶│  Agency Account │
│  (Buyer)    │                    │  (Connected)    │
└─────────────┘                    └─────────────────┘
       │                                   │
       │ ScalingAD orchestrates            │ Stripe handles
       │ milestone workflow                │ fees, payouts,
       │                                   │ disputes
       ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│                    Stripe                           │
└─────────────────────────────────────────────────────┘
```

### Per-Milestone Flow

1. Agency works on milestone → submits for review
2. Brand reviews → clicks **"Approve & Pay Milestone"**
3. Platform creates Stripe Checkout Session with `Stripe-Account: {agency_stripe_account_id}` header
4. Brand completes payment on agency's Stripe-hosted checkout
5. Funds go **directly** to agency's Stripe balance
6. Webhook confirms payment → milestone marked as `paid`

---

## Implementation Checklist

### Phase 1: Types & Schema ✅

- [x] **Update `types.ts`**
  - Remove `unfunded` and `funded` from `JobStatus`
  - New status flow: `pending` → `in_progress` → `review` → `approved` → `paid_out`
  - Add `stripe_payment_intent_id` to Milestone type

- [x] **Update database schema** (`011_direct_charges.sql`)
  - Remove `unfunded`, `funded`, `refunded` job statuses
  - Add `stripe_payment_intent_id`, `stripe_charge_id`, `stripe_checkout_session_id` to `milestones` table
  - Deprecated `job_payouts` table (no platform transfers)

### Phase 2: Edge Functions ✅

- [x] **Refactor `create-checkout-session`**
  - Use `stripeAccount` option for direct charge
  - Remove `transfer_data` / metadata for later transfer
  - No `application_fee_amount` (platform doesn't take fees)
  
- [x] **Refactor `create-payment-intent`**
  - Same direct charge pattern with `stripeAccount` option
  - Charge created on agency's connected account

- [x] **Create `pay-milestone` function** (NEW)
  - Creates checkout session for single milestone payment
  - Direct charge to agency account
  - Updates milestone status on success

- [x] **Update `stripe-webhook`**
  - Handle direct charge events on connected accounts
  - Handle `checkout.session.completed` for milestone payments
  - Handle `payment_intent.succeeded` / `charge.succeeded`
  - Remove `transfer.paid`, `transfer.failed` handlers
  - Mark milestone as `paid` on successful payment

- [x] **Deprecate `release-milestone`** ❌
  - Returns 410 Gone with migration message

- [x] **Deprecate `transfer-to-agency`** ❌
  - Returns 410 Gone with migration message

### Phase 3: Frontend - Business Portal ✅

- [x] **Update `JobDetail.tsx`**
  - Replace two-step "Approve" + "Release" with single **"Approve & Pay"** button
  - Remove "Fund Job" button entirely
  - Remove references to `unfunded` / `funded` statuses
  - Update status badges and messaging

- [x] **Update `Jobs.tsx`**
  - Remove "Unfunded" / "Funded" / "Refunded" status filters/badges

- [x] **Update `ProposalDetail.tsx`**
  - Remove escrow language in pricing section

### Phase 4: Frontend - Agency Portal ✅

- [x] **Update `ProjectDetail.tsx`**
  - Remove "Waiting for funding" states
  - Show direct payment flow after milestone submitted
  - Updated payment messaging

- [x] **Update `Projects.tsx`**
  - Remove unfunded/funded/refunded status displays

- [x] **Update `Dashboard.tsx`**
  - Remove unfunded/funded/refunded status configs

### Phase 5: Marketing & UX Copy ✅

- [x] **Update `Landing.tsx`**
  - Remove "escrow", "funds held", "secured upfront"
  - Use: "direct payment", "milestone-based", "pay as you go"
  - Updated FAQs, testimonials, feature cards

- [x] **Update `ForAgencies.tsx`**
  - Remove escrow language, use "Direct payments"

- [x] **Update `CreateProposal.tsx`**
  - Remove escrow messaging, use "Payment is made directly to you when work is approved"

- [ ] **Add agency fee/dispute disclaimer** (OPTIONAL)
  - Agencies pay Stripe processing fees
  - Agencies handle disputes
  - Surface in onboarding and dashboard

---

## UX Copy Guidelines

### ❌ Never Say
- "funds held"
- "escrow"
- "released"
- "secured upfront"
- "platform holds"

### ✅ Always Say
- "payment initiated"
- "payment successful"
- "funds available per Stripe payout schedule"
- "direct payment to agency"
- "pay when you approve"

---

## Technical Details

### Direct Charge API Pattern

```typescript
// Create checkout session ON the agency's connected account
const session = await stripe.checkout.sessions.create(
  {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `Milestone: ${milestone.title}` },
        unit_amount: amountInCents,
      },
      quantity: 1,
    }],
    success_url: `${origin}/brand/jobs/${jobId}?payment=success`,
    cancel_url: `${origin}/brand/jobs/${jobId}?payment=cancelled`,
    metadata: {
      milestone_id: milestone.id,
      job_id: job.id,
      business_id: business.id,
    },
  },
  {
    stripeAccount: agency.stripe_account_id, // Direct charge header
  }
);
```

### Webhook Configuration

For direct charges, webhooks fire on the **connected account**, not the platform.

Options:
1. **Connect Webhooks**: Configure a Connect webhook endpoint that receives events from all connected accounts
2. **Per-Account Webhooks**: Each connected account has its own webhook (more complex)

**Recommended:** Use Connect webhook endpoint with account filtering.

```typescript
// Webhook receives event with `account` field
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
const connectedAccountId = event.account; // Agency's Stripe account

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  const milestoneId = paymentIntent.metadata.milestone_id;
  // Update milestone status to 'paid'
}
```

---

## Database Migration

```sql
-- Remove escrow-related job statuses
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (
  status IN (
    'draft', 'pending', 'declined', 
    'in_progress', 'review', 'revision', 'approved', 'paid_out', 
    'cancelled'
  )
);

-- Add payment tracking to milestones
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Deprecate job_payouts (optional - keep for historical data)
-- No new rows will be inserted
```

---

## Stripe Dashboard Configuration

1. **Connect Settings**
   - Ensure agencies are Standard connected accounts
   - Enable appropriate payment methods

2. **Webhook Endpoints**
   - Create Connect webhook endpoint: `https://your-domain.com/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.succeeded`
     - `charge.dispute.created`

3. **Branding**
   - Direct charges use the connected account's branding
   - Agencies can customize their checkout appearance

---

## Risk & Liability

| Concern | Old Model (Escrow) | New Model (Direct) |
|---------|-------------------|-------------------|
| Funds custody | Platform holds | Never touches |
| Dispute liability | Platform | Agency |
| Refund liability | Platform | Agency |
| Stripe fees | Split/complex | Agency pays |
| Regulatory risk | Higher (money transmitter?) | Minimal |

---

## Files to Modify

### Backend (Edge Functions)
1. `supabase/functions/create-checkout-session/index.ts` - Refactor
2. `supabase/functions/create-payment-intent/index.ts` - Refactor
3. `supabase/functions/pay-milestone/index.ts` - CREATE NEW
4. `supabase/functions/stripe-webhook/index.ts` - Refactor
5. `supabase/functions/release-milestone/` - DELETE
6. `supabase/functions/transfer-to-agency/` - DELETE

### Frontend
1. `pages/brand/JobDetail.tsx` - Major refactor
2. `pages/brand/Jobs.tsx` - Status updates
3. `pages/agency/ProjectDetail.tsx` - Status updates
4. `pages/agency/Projects.tsx` - Status updates
5. `pages/public/Landing.tsx` - Copy changes
6. `pages/public/ForAgencies.tsx` - Copy changes
7. `pages/agency/CreateProposal.tsx` - Copy changes

### Types & Schema
1. `types.ts` - Remove statuses
2. `supabase/schema-complete.sql` - Update constraints
3. New migration file for schema changes

---

## Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| Create implementation plan | ✅ | This file |
| Update types.ts | 🔄 | In progress |
| Refactor create-checkout-session | ⏳ | Pending |
| Refactor create-payment-intent | ⏳ | Pending |
| Create pay-milestone function | ⏳ | Pending |
| Update stripe-webhook | ⏳ | Pending |
| Delete release-milestone | ⏳ | Pending |
| Delete transfer-to-agency | ⏳ | Pending |
| Update JobDetail.tsx | ⏳ | Pending |
| Update ProjectDetail.tsx | ⏳ | Pending |
| Update marketing copy | ⏳ | Pending |
| Database migration | ⏳ | Pending |
| Testing | ⏳ | Pending |

---

## Questions to Resolve

1. **Full job payments (non-milestone)?** 
   - Keep same pattern - single direct charge for full amount

2. **Partial refunds?**
   - Agency handles via their Stripe dashboard

3. **Agency payout timing?**
   - Standard ~7 days (varies by country)
   - Agencies may qualify for Instant Payouts (Stripe decides)

4. **Invoice-based payments?**
   - Can still work with direct charges if needed

---

*Last Updated: January 17, 2026*
