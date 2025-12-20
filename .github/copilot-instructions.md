# Copilot Instructions for Agency Matching Funnel MVP

## Project Overview
A React + TypeScript onboarding platform that matches businesses with marketing agencies based on strategic signals. Users complete a multi-step onboarding flow, and a matching engine generates agency recommendations with compatibility scores.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (via CDN)
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **Routing:** React Router DOM v7
- **No testing framework configured**

## Architecture

### Data Flow
1. User authenticates via `AuthContext` → Supabase Auth
2. Onboarding (`pages/Onboarding.tsx`) collects answers → stored in `user_profiles`
3. `MatchingEngine.generateMatches()` scores agencies and creates top 3 `deals`
4. Dashboard pages (`Deals`, `Ongoing`, `Agencies`) display and manage deals

### Key Files
- `types.ts` - All TypeScript interfaces and union types (use these, don't create duplicates)
- `lib/matchingEngine.ts` - Agency scoring algorithm (weighted: platforms 30%, budget 25%, industry 20%, objectives 15%, ops 10%)
- `lib/supabase.ts` - Supabase client (uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `supabase/schema.sql` - Complete database schema with RLS policies
- `config/theme.ts` - Centralized colors and design tokens

### Database Schema (snake_case)
- `user_profiles` - User onboarding data (platforms[], objectives[], spend_bracket, etc.)
- `agencies` - Agency profiles with capabilities and verified status
- `deals` - User-agency matches with `match_score` and status (`new`|`active`|`review`|`ongoing`)

⚠️ **Database uses snake_case**, TypeScript uses camelCase. Map fields when querying:
```typescript
// Example from Deals.tsx
const mapped = data.map(deal => ({
  matchScore: deal.match_score,
  agencyId: deal.agency_id,
  // ...
}));
```

## Conventions

### UI Components
- Use existing components from `components/ui/` (Button, Card, Input, Select, MultiSelect, Toast, Checkbox)
- `Button` variants: `primary`, `secondary`, `outline`, `ghost`
- `Card` with `hover` prop for interactive cards
- Icons: Material Icons Outlined via `<Icon name="icon_name" />`

### Styling
- Tailwind classes with dark mode support (`dark:` prefix)
- Glass effect: `glass` class for frosted backgrounds
- Primary color: `#EF2E6E` (use `text-primary`, `bg-primary`, `from-primary`)
- Gradients: `bg-gradient-to-r from-primary to-pink-600`
- Always include responsive variants (`sm:`, `md:`, `lg:`)

### Auth & Protected Routes
```tsx
// Wrap protected content with ProtectedRoute
<ProtectedRoute>
  <DashboardLayout><YourPage /></DashboardLayout>
</ProtectedRoute>
```
Access user/profile via `useAuth()` hook.

### Toast Notifications
```typescript
const { showToast } = useToast();
showToast("Success message", "success");
showToast("Error message", "error");
```

## Commands
```bash
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build
```

## Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Common Tasks

### Adding a New Page
1. Create component in `pages/`
2. Add route in `App.tsx` (wrap with `ProtectedRoute` + `DashboardLayout` if authenticated)
3. Add nav item in `components/Sidebar.tsx`

### Modifying Matching Algorithm
Edit `lib/matchingEngine.ts` - adjust weights in `calculateMatchScore()`. Current weights sum to 100.

### Adding Onboarding Questions
1. Add type to `types.ts` (e.g., new union type)
2. Add options array and step UI in `pages/Onboarding.tsx`
3. Update `user_profiles` schema in `supabase/schema.sql`

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

-- Jobs/Projects with payment tracking
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id),
  buyer_id UUID REFERENCES auth.users(id),
  agency_id UUID REFERENCES agencies(id),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('draft','unfunded','funded','in_progress','completed','paid_out','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE job_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending','captured','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout tracking
CREATE TABLE job_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  stripe_transfer_id TEXT,
  amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  event_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
├── payments/
│   ├── stripeClient.ts           # Stripe SDK init (server-side only)
│   ├── connectService.ts         # Agency onboarding, account management
│   ├── paymentService.ts         # PaymentIntents, captures, refunds
│   └── webhookHandler.ts         # Process Stripe events

supabase/
├── functions/
│   ├── stripe-webhook/           # Edge function for webhooks
│   ├── create-payment-intent/    # Buyer funds job
│   ├── create-connect-account/   # Agency onboarding link
│   └── transfer-to-agency/       # Release funds to agency
```
