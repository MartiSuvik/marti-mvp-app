# Stripe Connect Implementation Checklist

## Mission
Integrate Stripe Connect into ScalingAD platform to enable escrow-style payments between businesses and agencies. Businesses fund jobs, platform holds funds, releases to agencies upon work approval.

## Architecture
- **Model**: Marketplace with Destination Charges
- **Platform (ScalingAD)**: Merchant of Record
- **Flow**: Business → Platform (holds funds) → Agency (receives payout)
- **Fee**: Platform takes application fee (10%)

## User Flows
1. **Business**: Onboard → Match → Deal → Ongoing → Create Job → Fund → Approve → Release
2. **Agency**: Sign up → Stripe Connect onboarding → Get matched → Accept job → Work → Get paid

## Database Tables Needed
- [x] `jobs` - Core job entity
- [x] `job_milestones` - Optional phased payments
- [x] `job_payments` - Track Stripe PaymentIntents
- [x] `job_payouts` - Track Stripe Transfers
- [x] `ledger_entries` - Audit trail
- [x] Add `stripe_account_id` to `agencies`
- [x] Add `stripe_customer_id` to `user_profiles`

## Pages to Create
- [x] `pages/Jobs.tsx` - List all jobs for business
- [x] `pages/JobDetail.tsx` - Single job view with payment actions
- [x] `pages/CreateJob.tsx` - Job creation wizard
- [x] `pages/StripeOnboarding.tsx` - Agency Stripe Connect flow
- [ ] `pages/AgencyDashboard.tsx` - Agency's view (future)

## Pages to Update
- [x] `pages/Ongoing.tsx` - Add "Create Job" button
- [ ] `pages/AgencyDetail.tsx` - Show Stripe Connect status
- [x] `components/Sidebar.tsx` - Add Jobs nav item
- [x] `App.tsx` - Add new routes

## Types to Add (types.ts)
- [x] `Job` interface
- [x] `JobStatus` union type
- [x] `JobMilestone` interface
- [x] `JobPayment` interface
- [x] `JobPayout` interface
- [x] `LedgerEntry` interface

## Supabase Edge Functions (Future)
- [x] `stripe-webhook` - Handle Stripe events
- [x] `create-payment-intent` - Business funds job
- [x] `create-connect-account` - Agency onboarding link
- [x] `transfer-to-agency` - Release funds

## Implementation Progress

### Phase 1: Foundation ✅
- [x] Add Stripe types to `types.ts`
- [x] Create database schema SQL
- [x] Create job state machine types

### Phase 2: Agency Onboarding ✅
- [x] Create `StripeOnboarding.tsx` page
- [x] Add Stripe Connect button to agency signup
- [x] Handle onboarding callback

### Phase 3: Job Creation Flow ✅
- [x] Update `Ongoing.tsx` with Create Job button
- [x] Create `CreateJob.tsx` wizard
- [x] Create `Jobs.tsx` list page
- [x] Create `JobDetail.tsx` page

### Phase 4: Payment Integration ✅
- [x] Create Supabase Edge Functions for Stripe
- [x] Implement fund job flow
- [x] Implement approve & release flow
- [x] Handle webhooks
- [x] Deploy Edge Functions to Supabase
- [x] Set Stripe secrets in Supabase

### Phase 5: Polish ✅
- [x] Add sidebar navigation
- [x] Run database migrations
- [x] Connect frontend to Edge Functions
- [ ] Test full flow end-to-end

---

## Key Decisions Made
1. **Single payment per job** (not milestone-based) for MVP
2. **10% platform fee** on all transactions
3. **Destination charges** (platform is MoR)
4. **Stripe-hosted onboarding** for agencies (lowest effort)
5. **Manual dispute resolution** via Support page

## Important Files
- `types.ts` - All TypeScript interfaces
- `supabase/schema.sql` - Database schema
- `.github/copilot-instructions.md` - Agent instructions with Stripe MCP usage
- `stripe.md` - Stripe documentation links
