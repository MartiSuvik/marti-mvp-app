# Agency Portal Implementation Checklist

## Mission
Create an invite-only agency portal. Agencies don't self-register - they submit an interest form, we manually create their accounts in Supabase, and they log in to see an inverted dashboard (deals from businesses matched with them, job management, etc.).

## Key Decisions
1. **Invite-only access** - Agencies submit contact form → Admin manually creates account in Supabase
2. **Unified login** - Same login page for business and agency, redirect based on `user_type`
3. **Agency applications table** - Store form submissions in `agency_applications` table for tracking
4. **Inverted deals view** - Agencies see businesses matched with them, not the other way around
5. **MVP status model** - Keep existing deal statuses (`new | active | review | ongoing`)

## Database Changes
- [x] `agency_applications` table - Store form submissions (already have `user_type`, `agency_id` in user_profiles from previous work)

## Onboarding Flow Changes
- [x] Add "I am a business / I am an agency" selector as new Step 0
- [x] If agency → Show contact form (name, email, agency name, message)
- [x] Submit form → Save to `agency_applications` table
- [x] Redirect to "Thanks, we'll be in touch" confirmation page

## Login Flow Changes
- [x] After login, check `profile.userType`
- [x] If `agency` → redirect to `/agency`
- [x] If `business` → redirect to `/deals`

## Agency Pages
- [x] `AgencyDashboard.tsx` - Main dashboard with stats (already created)
- [x] `AgencyJobs.tsx` - List jobs assigned to agency (already created)
- [x] `AgencyJobDetail.tsx` - Job detail with accept/decline/submit actions (already created)
- [x] `AgencyDeals.tsx` - Inverted deals view (businesses matched with this agency)
- [ ] `AgencyDealDetail.tsx` - View matched business details (LATER)
- [ ] `/agency/profile` - Agency profile editing (LATER)

## Components
- [x] `AgencySidebar.tsx` - Navigation for agency users (already created)
- [x] `AgencyDashboardLayout.tsx` - Layout wrapper (already created)
- [x] Update `AgencySidebar.tsx` - Add "Matched Businesses" nav item

## Routes (App.tsx)
- [x] `/agency` - Dashboard (already added)
- [x] `/agency/deals` - Matched businesses
- [x] `/agency/jobs` - Jobs list (already added)
- [x] `/agency/jobs/:id` - Job detail (already added)
- [x] `/agency/stripe` - Stripe onboarding (already added)
- [ ] `/agency/deals/:id` - Business detail (LATER)

## Admin Workflow (Manual)
To create an agency user in Supabase:
1. Create auth user via Supabase Dashboard → Authentication → Users → Add User
2. Insert user_profiles row with `user_type = 'agency'` and `agency_id` = the agency's UUID
3. Update agencies row with `owner_id` = the new user's UUID

---

## Implementation Progress

### Step 1: Database - Agency Applications Table ✅
- [x] Add `agency_applications` table to schema.sql

### Step 2: Onboarding - User Type Selection ✅
- [x] Add Step 0 with business/agency toggle
- [x] Create agency contact form component
- [x] Submit to `agency_applications` table
- [x] Show confirmation message

### Step 3: Login Redirect Logic ✅
- [x] Update AuthContext or Login.tsx to redirect based on userType

### Step 4: Agency Deals Page ✅
- [x] Create `AgencyDeals.tsx` page
- [x] Query deals where `agency_id` matches user's agency
- [x] Display business info (from deal → user_profiles join)

### Step 5: Update Sidebar & Routes ✅
- [x] Add "Matched Businesses" to AgencySidebar
- [x] Add routes to App.tsx

### Step 6: Test Full Flow
- [ ] Test business onboarding still works
- [ ] Test agency form submission saves to table
- [ ] Create test agency user manually
- [ ] Test agency login redirects to /agency
- [ ] Test agency can see matched deals and jobs
