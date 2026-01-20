# Copilot Instructions for ScalingAD Platform MVP

## Project Overview
A dual-portal React + TypeScript marketplace connecting businesses with marketing agencies. Features include:
- **Business Portal:** Onboarding → Agency matching → Messaging → Proposals → Job management with Stripe payments
- **Agency Portal:** Dashboard → Matches → Proposal creation → Job tracking → Stripe Connect payouts
- Real-time messaging system with file attachments
- Milestone-based project payments
- Stripe Connect marketplace integration

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (via CDN)
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Edge Functions, Realtime)
- **Payments:** Stripe Connect (marketplace model, destination charges)
- **Routing:** React Router DOM v7
- **No testing framework configured**

## Architecture

### User Types
1. **Business Users** (`user_type: 'business'`)
   - Complete 20-question onboarding
   - Receive agency matches based on scoring algorithm
   - Create jobs, accept proposals, fund milestones
   - Communicate via real-time messaging
   - Pay via Stripe Checkout/Invoice

2. **Agency Users** (`user_type: 'agency'`)
   - Linked to an agency via `agency_id` and `owner_id`
   - View matched businesses
   - Create and send proposals
   - Accept jobs and track milestones
   - Receive payouts via Stripe Connect

### Data Flow
1. **Business Onboarding:**
   - User authenticates via `AuthContext` → Supabase Auth
   - Onboarding (`pages/public/Onboarding.tsx`) collects 20 answers → stored in `user_profiles`
   - `MatchingEngine.generateMatches()` scores agencies and creates top 3 `deals`

2. **Agency Interaction:**
   - Businesses message agencies → `conversations` + `messages` tables
   - Agencies create proposals → `proposals` table
   - Businesses accept proposals → converts to `jobs`

3. **Job & Payment Flow:**
   - Business creates/accepts job → status: `draft` → `pending` → `unfunded`
   - Agency accepts → status: `unfunded` (awaiting payment)
   - Business funds job → Stripe PaymentIntent → status: `funded`
   - Agency works → status: `in_progress` → `review` → `approved`
   - Platform releases funds → Stripe Transfer → status: `paid_out`

### Key Files
- `types.ts` - All TypeScript interfaces (User, Agency, Deal, Proposal, Job, Milestone, Message, etc.)
- `lib/matchingEngine.ts` - Agency scoring algorithm (weighted: platforms 35%, budget 25%, consistency 15%, profitability 15%, ops 10%)
- `lib/supabase.ts` - Supabase client (uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `supabase/schema.sql` - Complete database schema with RLS policies
- `supabase/migrations/` - Schema migrations (onboarding, messages, proposals, milestones, Stripe fields)
- `config/theme.ts` - Centralized colors and design tokens
- `config/features.ts` - Feature flags (waitlist mode, whitelisted emails)

### Database Schema (snake_case)
**Core Tables:**
- `user_profiles` - User data: 20 onboarding fields, `user_type`, `agency_id`, `stripe_customer_id`
- `agencies` - Agency profiles with `owner_id`, `stripe_account_id`, `stripe_onboarding_complete`, `stripe_payouts_enabled`
- `deals` - User-agency matches with `match_score` and status (`new`|`active`|`review`|`ongoing`)

**Proposal & Job Tables:**
- `proposals` - Agency proposals (status: `draft`|`sent`|`accepted`|`declined`|`converted`)
- `jobs` - Projects between business & agency (status: `draft`|`pending`|`declined`|`unfunded`|`funded`|`in_progress`|`review`|`revision`|`approved`|`paid_out`|`cancelled`|`refunded`)
- `milestones` - Phased payments within jobs (status: `pending`|`in_progress`|`submitted`|`approved`|`paid`|`revision`)

**Payment Tables:**
- `job_payments` - Tracks Stripe PaymentIntents (status: `pending`|`succeeded`|`failed`|`refunded`)
- `job_payouts` - Tracks Stripe Transfers to agencies (status: `pending`|`paid`|`failed`)
- `ledger_entries` - Audit trail for all payment events

**Messaging Tables:**
- `conversations` - One per deal, links business ↔ agency
- `messages` - Chat messages with `sender_type`, `message_type`, `attachments` (JSONB)

**Other:**
- `agency_applications` - Interest form submissions for invite-only agency onboarding

⚠️ **Database uses snake_case**, TypeScript uses camelCase. Map fields when querying:
```typescript
// Example from Jobs.tsx
const mapped = data.map(job => ({
  businessId: job.business_id,
  agencyId: job.agency_id,
  hasMilestones: job.has_milestones,
  totalReleased: job.total_released,
  // ...
}));
```

## Conventions

### UI Components
- Use existing components from `components/ui/` (Button, Card, Input, Select, MultiSelect, Toast, Checkbox, ConfirmModal)
- `Button` variants: `primary`, `secondary`, `outline`, `ghost`
- `Card` with `hover` prop for interactive cards
- Icons: Material Icons Outlined via `<Icon name="icon_name" />`
- `ConfirmModal` for confirmation dialogs (delete, cancel actions)

### Styling
- Tailwind classes with dark mode support (`dark:` prefix)
- Glass effect: `glass` class for frosted backgrounds
- Primary color: `#EF2E6E` (use `text-primary`, `bg-primary`, `from-primary`)
- Gradients: `bg-gradient-to-r from-primary to-pink-600`
- Always include responsive variants (`sm:`, `md:`, `lg:`)

### Auth & Protected Routes
```tsx
// Business-only routes
<BrandProtectedRoute>
  <DashboardLayout><YourPage /></DashboardLayout>
</BrandProtectedRoute>

// Agency-only routes
<AgencyProtectedRoute>
  <AgencyDashboardLayout><YourPage /></AgencyDashboardLayout>
</AgencyProtectedRoute>
```
Access user/profile via `useAuth()` hook (includes `isAgencyUser` boolean).

### Toast Notifications
```typescript
const { showToast } = useToast();
showToast("Success message", "success");
showToast("Error message", "error");
```

### Real-time Messaging
Use custom hooks for messaging:
- `useConversations()` - Fetch conversations with last message + unread count
- `useChat(conversationId)` - Messages + real-time subscription
- `useUnreadCount()` - Total unread messages across all conversations

## Commands
```bash
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build

# Supabase Edge Functions
supabase functions deploy <function-name>  # Deploy a specific edge function
supabase functions deploy                  # Deploy all edge functions
supabase secrets list                      # List environment secrets
supabase secrets set KEY=value             # Set environment secret
```

## Critical Development Rules

### Edge Function Deployment
**ALWAYS mention edge function deployment after modifying edge function code.**

When you update any file in `supabase/functions/*/index.ts`, you MUST tell the user to deploy:
```bash
supabase functions deploy <function-name>
```

Example: After updating `create-stripe-login-link/index.ts`, instruct:
```bash
supabase functions deploy create-stripe-login-link
```

## Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Common Tasks

### Adding a New Page
1. Create component in `pages/brand/` or `pages/agency/` (or `pages/public/` for unauthenticated)
2. Add route in `App.tsx` (wrap with `BrandProtectedRoute` or `AgencyProtectedRoute` + respective layout)
3. Add nav item in `components/Sidebar.tsx` (business) or `components/AgencySidebar.tsx` (agency)

### Modifying Matching Algorithm
Edit `lib/matchingEngine.ts` - adjust weights in `calculateMatchScore()`. Current weights:
- Platforms: 35%
- Budget: 25%
- Revenue Consistency: 15%
- Profitability: 15%
- Operations: 10%

### Adding Onboarding Questions
1. Add type to `types.ts` (e.g., new union type or field in `OnboardingAnswers`)
2. Add options array and step UI in `pages/public/Onboarding.tsx`
3. Update `user_profiles` schema in `supabase/schema-complete.sql` or create new migration

### Working with Jobs & Milestones
- Jobs can have milestones (`has_milestones: true`)
- Milestone flow: `pending` → `in_progress` → `submitted` → `approved` → `paid`
- Use edge functions for payment operations:
  - `create-payment-intent` - Fund job
  - `release-milestone` - Release milestone payment to agency
  - `transfer-to-agency` - Full job payout

### Stripe Connect Operations
- Agency onboarding: `/agency/stripe` → `create-connect-account` edge function
- Payment flow: Business pays → Platform holds → Agency completes → Platform transfers
- Use `verify-stripe-account` to check agency payout status
- `create-stripe-login-link` for agency to access Stripe Dashboard

---

## Stripe Integration (Stripe Connect)

### 🔧 Tools & Documentation
- **ALWAYS use Stripe MCP** for any Stripe-related development (queries, docs, testing)
- **Reference** `stripe.md` in project root for documentation links
- **Primary Goal:** Stripe Connect for agency payouts (marketplace model)

### Stripe MCP Commands
When developing Stripe features, use these MCP tools:
```
mcp_stripe_search_stripe_documentation  # Search Stripe docs
mcp_stripe_get_stripe_account_info      # Get connected account info
mcp_stripe_create_customer              # Create customers
mcp_stripe_create_product               # Create products
mcp_stripe_create_price                 # Set pricing
mcp_stripe_create_payment_link          # Generate payment links
mcp_stripe_list_products                # List all products
mcp_stripe_retrieve_balance             # Check account balance
```

### ScalingAD Payment Model
- **Type:** Marketplace (Destination Charges)
- **Platform (ScalingAD):** Merchant of Record
- **Flow:** Buyer pays platform → Platform transfers to Agency
- **Fees:** Platform takes application fee from each transaction

### Stripe Connect Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Buyer     │────▶│  ScalingAD   │────▶│  Agency         │
│  (Business) │     │  (Platform)  │     │  (Connected Acct)│
└─────────────┘     └──────────────┘     └─────────────────┘
    Pays              Holds funds         Receives payout
                      Takes fee           via Transfer
```

### Key Connect Concepts
1. **Destination Charges** - Payment created on platform, funds transferred to connected account
2. **Connected Accounts** - Agencies onboard via Stripe-hosted flow (Account Links)
3. **Transfers** - Move funds from platform to connected account
4. **Application Fees** - Platform's cut from each transaction

### Best Practices (from Stripe MCP docs)
- ✅ Use Stripe-hosted onboarding for agencies (lowest effort, handles KYC)
- ✅ Enable Radar for fraud prevention
- ✅ Set up Connect webhooks for real-time notifications
- ✅ Let Stripe handle negative balance liability (for new platforms)
- ✅ Store all Stripe IDs in database (payment_intent_id, transfer_id, account_id)
- ❌ Don't mix charge types (pick destination OR direct, not both)
- ❌ Don't use outdated terms (Standard/Express/Custom) - use controller properties

### Stripe Connect Documentation Links
When implementing Connect features, reference these docs:

**Getting Started:**
- [Design your Connect integration](https://docs.stripe.com/connect/design-an-integration.md)
- [Build a marketplace](https://docs.stripe.com/connect/marketplace.md) ← Our model
- [Accounts v2 API](https://docs.stripe.com/connect/accounts-v2.md)

**Connected Account Management:**
- [Choose onboarding configuration](https://docs.stripe.com/connect/onboarding.md)
- [Enable account capabilities](https://docs.stripe.com/connect/account-capabilities.md)
- [Required verification info](https://docs.stripe.com/connect/required-verification-information.md)

**Payment Processing:**
- [Create a charge](https://docs.stripe.com/connect/charges.md)
- [Account balances](https://docs.stripe.com/connect/account-balances.md)
- [Payouts to connected accounts](https://docs.stripe.com/connect/payouts-connected-accounts.md)

**Platform Admin:**
- [Platform pricing tool](https://docs.stripe.com/connect/platform-pricing-tools.md)
- [Dashboard management](https://docs.stripe.com/connect/dashboard.md)
- [Stripe Radar with Connect](https://docs.stripe.com/connect/radar.md)

**Embedded Components:**
- [Connect embedded components](https://docs.stripe.com/connect/get-started-connect-embedded-components.md) - Add dashboard functionality to your app

### Payout Options for Agencies
| Option | Best For | Timing | Fee |
|--------|----------|--------|-----|
| **Next-day settlement** | Automatic liquidity | Next business day | 0.6% |
| **Instant Payouts** | Manual, as-needed | Within 30 minutes | [Variable](https://docs.stripe.com/payouts/instant-payouts.md#pricing) |

### Database Tables for Payments
```sql
-- Agencies with Stripe Connect
ALTER TABLE agencies ADD COLUMN stripe_account_id TEXT;
ALTER TABLE agencies ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE agencies ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE agencies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE agencies ADD COLUMN contact_email TEXT;

-- User profiles with Stripe customer ID
ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE user_profiles ADD COLUMN user_type TEXT DEFAULT 'business' CHECK (user_type IN ('business', 'agency'));
ALTER TABLE user_profiles ADD COLUMN agency_id UUID REFERENCES agencies(id);

-- Jobs/Projects with payment tracking
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'direct' CHECK (source IN ('proposal', 'direct')),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'declined', 'unfunded', 'funded', 
    'in_progress', 'review', 'revision', 'approved', 'paid_out', 'cancelled', 'refunded'
  )),
  has_milestones BOOLEAN DEFAULT false,
  total_released DECIMAL(10,2) DEFAULT 0,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones for phased payments
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'submitted', 'approved', 'paid', 'revision'
  )),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE job_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout tracking
CREATE TABLE job_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_transfer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations & Messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE UNIQUE,
  business_id UUID NOT NULL REFERENCES auth.users(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('business', 'agency')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'video_call', 'system')),
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

### Environment Variables for Stripe
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Events to Handle
- `payment_intent.succeeded` - Buyer payment captured
- `payment_intent.payment_failed` - Payment failed
- `transfer.paid` - Agency payout completed
- `account.updated` - Agency account status changed
- `account.application.deauthorized` - Agency disconnected

### File Structure for Payments
```
lib/
├── fileUpload.ts                 # File upload utilities for attachments
├── matching.ts                   # Matching utilities
├── matchingEngine.ts             # Agency scoring algorithm
└── supabase.ts                   # Supabase client init

supabase/
├── schema.sql                    # Complete database schema
├── functions/
│   ├── accept-proposal/          # Convert proposal to job
│   ├── create-checkout-session/  # Stripe Checkout for job funding
│   ├── create-connect-account/   # Agency onboarding link
│   ├── create-invoice-checkout/  # Invoice-based checkout
│   ├── create-payment-intent/    # Create PaymentIntent for jobs
│   ├── create-stripe-login-link/ # Agency Stripe Dashboard access
│   ├── create-zoom-meeting/      # Video call integration
│   ├── get-or-create-stripe-customer/ # Customer management
│   ├── notify-agency-hire/       # Email notifications
│   ├── notify-agency-match/      # Match notifications
│   ├── release-milestone/        # Release milestone payment
│   ├── stripe-webhook/           # Stripe webhook handler
│   ├── transfer-to-agency/       # Transfer funds to agency
│   └── verify-stripe-account/    # Check agency payout status
└── migrations/
    ├── 002_new_onboarding_questionnaire.sql
    ├── 003_add_message_type.sql
    ├── 004_add_message_attachments.sql
    ├── 005_agency_jobs_rls.sql
    ├── 005_create_proposals.sql
    ├── 006_add_stripe_customer_id.sql
    ├── 007_add_stripe_invoice_id.sql
    └── 008_add_milestones.sql
```
