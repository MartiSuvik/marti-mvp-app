Read [](file:///Users/martisuvorov/Desktop/%F0%9F%8D%8F%20APPS/scalingad.com/supabase/functions/create-connect-account/index.ts#1-1), lines 1 to 20

The issue is that your edge function is using `STRIPE_SECRET_KEY` environment variable. You need to check which key is set in Supabase: 

Ran terminal command:  cd "/Users/martisuvorov/Desktop/🍏 APPS/scalingad.com" && supabase secrets list

Your `STRIPE_SECRET_KEY` is set. The issue is **it's set to your live key** (`sk_live_...`), not test key (`sk_test_...`).

To use test mode, you need to update the secret:

```bash
# Set test key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY

# Also update webhook secret for test mode
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
```

Get your test keys from: https://dashboard.stripe.com/test/apikeys

**However**, if you want to switch between test/live dynamically, you could modify the function to accept which mode to use, or maintain separate keys:

```bash
# Keep both
supabase secrets set STRIPE_SECRET_KEY_LIVE=sk_live_...
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_...
```

Then modify your functions to choose based on an environment variable or parameter. But for testing, just temporarily set `STRIPE_SECRET_KEY` to your test key.