Here's the SQL to create a fresh test agency with an agency user:

```sql
-- 1. Create the test agency (no Stripe setup)
INSERT INTO agencies (
  id,
  name,
  description,
  logo_url,
  platforms,
  industries,
  spend_brackets,
  objectives,
  capabilities,
  verified,
  stripe_account_id,
  stripe_onboarding_complete,
  stripe_payouts_enabled,
  owner_id,
  contact_email
) VALUES (
  gen_random_uuid(),
  'Test Agency - Direct Charges',
  'A test agency for verifying the direct charges payment flow',
  NULL,
  ARRAY['meta', 'google', 'tiktok'],
  ARRAY['ecommerce', 'saas'],
  ARRAY['10000-25000', '25000-50000'],
  ARRAY['scale', 'acquisition'],
  ARRAY['paid_social', 'paid_search', 'creative'],
  true,
  NULL,  -- No Stripe account yet
  false, -- Onboarding not complete
  false, -- Payouts not enabled
  NULL,  -- Will set owner after creating user
  'test-agency@example.com'
)
RETURNING id;

-- Copy the returned agency ID and use it below
-- Replace 'YOUR_AGENCY_ID' with the actual UUID returned above
-- Replace 'YOUR_USER_ID' with the auth.users id of the agency user you want to link

-- 2. Link the agency owner (run after you create/login the agency user)
-- UPDATE agencies SET owner_id = 'YOUR_USER_ID' WHERE id = 'YOUR_AGENCY_ID';

-- 3. Update the user profile to be an agency user
-- UPDATE user_profiles 
-- SET user_type = 'agency', agency_id = 'YOUR_AGENCY_ID'
-- WHERE user_id = 'YOUR_USER_ID';
```

**Or if you want a single script with a specific email** (for an existing auth user):

```sql
-- Find or use existing user, then create agency and link
DO $$
DECLARE
  v_agency_id uuid;
  v_user_id uuid;
BEGIN
  -- Get user ID by email (change this to your test user's email)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'agency-test@yourmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Create the user via signup first.';
  END IF;

  -- Create agency
  INSERT INTO agencies (
    name, description, platforms, industries, spend_brackets, 
    objectives, capabilities, verified, 
    stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled,
    owner_id, contact_email
  ) VALUES (
    'Test Agency - Direct Charges',
    'Test agency for payment flow verification',
    ARRAY['meta', 'google', 'tiktok'],
    ARRAY['ecommerce', 'saas'],
    ARRAY['10000-25000', '25000-50000'],
    ARRAY['scale', 'acquisition'],
    ARRAY['paid_social', 'paid_search'],
    true,
    NULL, false, false,
    v_user_id,
    'agency-test@yourmail.com'
  )
  RETURNING id INTO v_agency_id;

  -- Update user profile to agency type
  UPDATE user_profiles 
  SET user_type = 'agency', agency_id = v_agency_id
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Created agency % for user %', v_agency_id, v_user_id;
END $$;
```

**Steps to use:**
1. Sign up a new account with email like `agency-test@yourmail.com` via your app's login page
2. Run the SQL above (update the email to match)
3. Log in with that account → you'll be redirected to agency portal
4. Navigate to `/agency/stripe` to start Stripe Connect onboarding