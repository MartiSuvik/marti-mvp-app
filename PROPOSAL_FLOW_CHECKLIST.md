# Proposal Flow Implementation Checklist

> **Goal:** Flip the payment flow so agencies create proposals and brands accept + pay.

---

## Phase 0: Sidebar Cleanup (COMPLETED)

- [x] Update Brand Sidebar - Rename "Deals" → "Matches", add "Proposals", remove "Ongoing"
- [x] Update Agency Sidebar - Rename to "Matches", add "Proposals", rename "Jobs" → "Projects"
- [x] Remove `pages/Ongoing.tsx` - redundant with Jobs
- [x] Create `pages/AgencyProfile.tsx` - agency profile editing
- [x] Add `/agency/profile` route
- [x] Update `/agency/stripe` → `/agency/payouts` route

---

## Phase 1: Database & Types

- [ ] Add `proposals` table to `supabase/schema.sql`
- [ ] Add RLS policies for proposals (agency write, business read)
- [ ] Add `ProposalStatus` type to `types.ts`
- [ ] Add `Proposal` interface to `types.ts`
- [ ] Run schema migration in Supabase

---

## Phase 2: Agency Proposal UI

- [ ] Create `pages/AgencyProposals.tsx` - list all agency proposals
- [ ] Create `pages/AgencyCreateProposal.tsx` - form to create proposal
- [ ] Add "Proposals" nav item to `components/AgencySidebar.tsx`
- [ ] Add "Send Proposal" button on `pages/AgencyDeals.tsx`
- [ ] Add route `/agency/proposals` in `App.tsx`
- [ ] Add route `/agency/proposals/new/:dealId` in `App.tsx`

---

## Phase 3: Brand Proposal UI

- [ ] Create `pages/Proposals.tsx` - list incoming proposals
- [ ] Create `pages/ProposalDetail.tsx` - view, accept/decline, pay
- [ ] Add "Proposals" nav item to `components/Sidebar.tsx`
- [ ] Add proposal notification badge on Deals page
- [ ] Add route `/proposals` in `App.tsx`
- [ ] Add route `/proposals/:id` in `App.tsx`

---

## Phase 4: Backend - Accept Proposal Flow

- [ ] Create `supabase/functions/accept-proposal/index.ts`
  - [ ] Validate proposal exists and belongs to business
  - [ ] Create job from proposal data
  - [ ] Create Stripe PaymentIntent
  - [ ] Update proposal status to `converted`
  - [ ] Return client secret for payment
- [ ] Update `stripe-webhook` to handle proposal-originated jobs

---

## Phase 5: Cleanup & Deprecation

- [ ] Remove `pages/CreateJob.tsx`
- [ ] Remove CreateJob route from `App.tsx`
- [ ] Remove "Create Job" button from brand UI
- [ ] Update `pages/Jobs.tsx` to only show jobs (no create action)
- [ ] Update `pages/JobDetail.tsx` if needed

---

## Phase 6: Admin UI (Agency Management)

- [ ] Create `pages/Admin.tsx` - dashboard with tabs
- [ ] Add pending agency applications tab (from `agency_applications`)
- [ ] Add approved agencies list tab
- [ ] Add approve action: create auth user, user_profile, agency row
- [ ] Add route `/admin` in `App.tsx` (protected by env check or hardcoded emails)
- [ ] Add simple admin auth check (e.g., allowlist of admin emails)

---

## Phase 7: Testing & Polish

- [ ] Test full flow: Agency creates proposal → Brand accepts → Payment → Job created
- [ ] Test proposal decline flow
- [ ] Test agency Stripe Connect → proposal → payout flow
- [ ] Add loading states and error handling
- [ ] Add toast notifications for all actions

---

## Notes

- Brand job creation is **removed** (agencies initiate all work via proposals)
- No proposal expiration feature for MVP
- Admin access via email allowlist, not user_type

PROPOSAL_FLOW_PRD

# PRD: Agency Proposal & Brand Payment Flow

**Version:** 1.0  
**Date:** December 18, 2025  
**Status:** Planning

---

## Overview

ScalingAD is a marketplace connecting businesses with marketing agencies. This PRD defines the core transaction flow where **agencies create proposals** for matched businesses, and **businesses accept and pay** to initiate work.

---

## Problem Statement

The current implementation has the payment/proposal process inverted:
- Brands create jobs and set budgets
- Agencies passively accept or decline

This doesn't reflect real-world agency dynamics where agencies scope work and propose pricing.

---

## Solution

Flip the flow:
1. **Agencies** create proposals for matched businesses (from deals)
2. **Businesses** review, accept/decline, and pay via Stripe
3. **Jobs** are auto-created when a proposal is accepted and paid
4. **Work lifecycle** continues as normal (in_progress → review → payout)

---

## User Stories

### Agency User

| As an agency, I want to... | So that... |
|---------------------------|------------|
| See my matched businesses (deals) | I know who I can work with |
| Create a proposal for a matched business | I can pitch my services with custom pricing |
| View all my proposals and their statuses | I can track my sales pipeline |
| See when a proposal is accepted | I know to start working |
| Complete work and get paid | I earn revenue |

### Business User

| As a business, I want to... | So that... |
|----------------------------|------------|
| See incoming proposals from agencies | I can evaluate options |
| View proposal details (scope, price) | I can make informed decisions |
| Accept a proposal and pay | I can hire an agency |
| Decline a proposal | I can pass on offers |
| Track active jobs | I can monitor work progress |
| Approve completed work | Agency gets paid |

### Admin User

| As an admin, I want to... | So that... |
|--------------------------|------------|
| See pending agency applications | I can review new agencies |
| Approve an agency application | They can access the platform |
| View all approved agencies | I can manage the marketplace |

---

## Data Model

### Proposal

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `deal_id` | UUID | Reference to the deal (match) |
| `agency_id` | UUID | Agency creating the proposal |
| `business_id` | UUID | Business receiving the proposal |
| `title` | TEXT | Proposal title |
| `description` | TEXT | Scope of work |
| `amount` | DECIMAL | Proposed price |
| `currency` | TEXT | Currency code (default: USD) |
| `platform_fee` | DECIMAL | ScalingAD's cut |
| `status` | ENUM | draft, sent, accepted, declined, converted |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Proposal Status Flow

```
draft ──▶ sent ──┬──▶ accepted ──▶ converted (job created)
                 │
                 └──▶ declined
```

### Job (existing, modified context)

Jobs are now **created from proposals**, not by brands directly.

| Field | Change |
|-------|--------|
| `proposal_id` | NEW - Reference to source proposal |

### Job Status Flow (unchanged)

```
funded ──▶ in_progress ──▶ review ◀──▶ revision ──▶ approved ──▶ paid_out
```

---

## User Flows

### Flow 1: Agency Creates Proposal

```
Agency Dashboard
      │
      ▼
Agency Deals ──▶ [View matched businesses]
      │
      ▼
Click "Send Proposal" on a deal
      │
      ▼
Create Proposal Form
  - Title
  - Description (scope of work)
  - Amount
      │
      ▼
Submit ──▶ Proposal status: "sent"
      │
      ▼
Business receives notification
```

### Flow 2: Business Accepts & Pays

```
Business Dashboard
      │
      ▼
Proposals Page ──▶ [View incoming proposals]
      │
      ▼
Click on proposal ──▶ Proposal Detail
      │
      ├──▶ [Decline] ──▶ Status: "declined"
      │
      └──▶ [Accept & Pay]
              │
              ▼
      Stripe Checkout
              │
              ▼
      Payment Success
              │
              ▼
      Proposal: "converted"
      Job: auto-created with status "funded"
              │
              ▼
      Agency notified to start work
```

### Flow 3: Work Completion & Payout

```
Agency works on job
      │
      ▼
Agency submits for review ──▶ Job status: "review"
      │
      ▼
Business reviews work
      │
      ├──▶ [Request Revision] ──▶ Status: "revision"
      │
      └──▶ [Approve]
              │
              ▼
      Job status: "approved"
              │
              ▼
      Stripe Transfer to Agency
              │
              ▼
      Job status: "paid_out"
```

---

## Pages & Routes

### Agency Portal

| Route | Page | Description |
|-------|------|-------------|
| `/agency` | AgencyDashboard | Overview stats |
| `/agency/deals` | AgencyDeals | Matched businesses |
| `/agency/proposals` | AgencyProposals | All proposals |
| `/agency/proposals/new/:dealId` | AgencyCreateProposal | Create proposal form |
| `/agency/jobs` | AgencyJobs | Active jobs |
| `/agency/jobs/:id` | AgencyJobDetail | Job detail |
| `/agency/payouts` | StripeOnboarding | Stripe Connect setup |

### Business Portal

| Route | Page | Description |
|-------|------|-------------|
| `/deals` | Deals | Matched agencies |
| `/proposals` | Proposals | Incoming proposals |
| `/proposals/:id` | ProposalDetail | View & accept/decline |
| `/jobs` | Jobs | Active jobs |
| `/jobs/:id` | JobDetail | Job detail |

### Admin Portal

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Admin | Agency management dashboard |

---

## API / Edge Functions

### `accept-proposal`

**Trigger:** Business accepts and pays for a proposal

**Input:**
```json
{
  "proposalId": "uuid",
  "paymentMethodId": "pm_xxx" // optional, for saved cards
}
```

**Process:**
1. Validate proposal belongs to authenticated business
2. Validate proposal status is "sent"
3. Calculate platform fee
4. Create Stripe PaymentIntent with destination charge
5. Create Job record from proposal data
6. Update proposal status to "converted"
7. Return PaymentIntent client secret

**Output:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "jobId": "uuid"
}
```

---

## Admin Access

Admin functionality is protected by an **email allowlist**, not a user type.

```typescript
const ADMIN_EMAILS = [
  "admin@scalingad.com",
  // Add other admin emails
];

const isAdmin = ADMIN_EMAILS.includes(user?.email);
```

### Admin Capabilities

1. **View pending agency applications** (from `agency_applications` table)
2. **Approve agency:**
   - Create Supabase Auth user (send invite email)
   - Create `user_profiles` row with `user_type: 'agency'`
   - Create `agencies` row linked to user
3. **View/manage approved agencies**

---

## Removed Features (MVP Scope)

| Feature | Reason |
|---------|--------|
| Brand creates jobs directly | Agencies drive proposals |
| Proposal expiration (`valid_until`) | Adds complexity, not needed for MVP |
| Admin user type | Email allowlist is simpler |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Proposal → Accepted conversion | > 30% |
| Time from proposal to payment | < 48 hours |
| Agency payout success rate | > 99% |

---

## Technical Notes

- **Stripe Connect:** Using Destination Charges (platform is merchant of record)
- **Platform Fee:** Calculated as percentage of proposal amount
- **Database:** PostgreSQL via Supabase with RLS policies
- **Frontend:** React 19 + TypeScript + Tailwind CSS

---

## Open Questions

1. What is the platform fee percentage? (Suggest: 10-15%)
2. Should we send email notifications for new proposals?
3. Do we need proposal templates for agencies?

---

## Appendix: File Changes Summary

| Action | File |
|--------|------|
| CREATE | `supabase/schema.sql` (proposals table) |
| CREATE | `types.ts` (Proposal types) |
| CREATE | `pages/AgencyProposals.tsx` |
| CREATE | `pages/AgencyCreateProposal.tsx` |
| CREATE | `pages/Proposals.tsx` |
| CREATE | `pages/ProposalDetail.tsx` |
| CREATE | `pages/Admin.tsx` |
| CREATE | `supabase/functions/accept-proposal/index.ts` |
| MODIFY | `components/AgencySidebar.tsx` |
| MODIFY | `components/Sidebar.tsx` |
| MODIFY | `pages/AgencyDeals.tsx` |
| MODIFY | `App.tsx` |
| DELETE | `pages/CreateJob.tsx` |
