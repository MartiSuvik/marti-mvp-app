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




It worked but now when I use edge function it gives me this error:

{
  "event_message": "Error creating login link: Error: The provided key 'sk_test_*********************************************************************************************6k958v' does not have access to account 'acct_1SoLF9PtVJJIGP4e' (or that account does not exist). Application access may have been revoked.\n    at s.toJSON.then.z.message (https://esm.sh/stripe@14.5.0/es2022/stripe.mjs:4:16210)\n    at eventLoopTick (ext:core/01_core.js:175:7) {\n  type: \"te\",\n  raw: {\n    code: \"account_invalid\",\n    doc_url: \"https://stripe.com/docs/error-codes/account-invalid\",\n    message: \"The provided key 'sk_test_*********************************************************************************************6k958v' does not have access to account 'acct_1SoLF9PtVJJIGP4e' (or that account does not exist). Application access may have been revoked.\",\n    type: \"invalid_request_error\",\n    headers: {\n      \"access-control-allow-credentials\": \"true\",\n      \"access-control-allow-methods\": \"GET, HEAD, PUT, PATCH, POST, DELETE\",\n      \"access-control-allow-origin\": \"*\",\n      \"access-control-expose-headers\": \"Request-Id, Stripe-Manage-Version, Stripe-Should-Retry, X-Stripe-External-Auth-Required, X-Stripe-Privileged-Session-Required\",\n      \"access-control-max-age\": \"300\",\n      \"cache-control\": \"no-cache, no-store\",\n      \"content-length\": \"435\",\n      \"content-security-policy\": \"base-uri 'none'; default-src 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; script-src 'self' 'report-sample'; style-src 'self'; worker-src 'none'; upgrade-insecure-requests; report-uri https://q.stripe.com/csp-violation?q=prBBs-mzicQ6OZ6N37CG4qxtWeVRgOJN_VjoQQXn9gTAzNGCnepYj-r07F2w02nVkY0m7X1jziAoiiWz\",\n      \"content-type\": \"application/json\",\n      date: \"Mon, 19 Jan 2026 10:39:12 GMT\",\n      server: \"nginx\",\n      \"strict-transport-security\": \"max-age=63072000; includeSubDomains; preload\",\n      \"stripe-version\": \"2023-10-16\",\n      vary: \"Origin\",\n      \"x-stripe-priority-routing-enabled\": \"true\",\n      \"x-stripe-routing-context-priority-tier\": \"api-testmode\",\n      \"x-wc\": \"ABGHIJ\"\n    },\n    statusCode: 403,\n    requestId: undefined\n  },\n  rawType: \"invalid_request_error\",\n  code: \"account_invalid\",\n  doc_url: \"https://stripe.com/docs/error-codes/account-invalid\",\n  param: undefined,\n  detail: undefined,\n  headers: {\n    \"access-control-allow-credentials\": \"true\",\n    \"access-control-allow-methods\": \"GET, HEAD, PUT, PATCH, POST, DELETE\",\n    \"access-control-allow-origin\": \"*\",\n    \"access-control-expose-headers\": \"Request-Id, Stripe-Manage-Version, Stripe-Should-Retry, X-Stripe-External-Auth-Required, X-Stripe-Privileged-Session-Required\",\n    \"access-control-max-age\": \"300\",\n    \"cache-control\": \"no-cache, no-store\",\n    \"content-length\": \"435\",\n    \"content-security-policy\": \"base-uri 'none'; default-src 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; script-src 'self' 'report-sample'; style-src 'self'; worker-src 'none'; upgrade-insecure-requests; report-uri https://q.stripe.com/csp-violation?q=prBBs-mzicQ6OZ6N37CG4qxtWeVRgOJN_VjoQQXn9gTAzNGCnepYj-r07F2w02nVkY0m7X1jziAoiiWz\",\n    \"content-type\": \"application/json\",\n    date: \"Mon, 19 Jan 2026 10:39:12 GMT\",\n    server: \"nginx\",\n    \"strict-transport-security\": \"max-age=63072000; includeSubDomains; preload\",\n    \"stripe-version\": \"2023-10-16\",\n    vary: \"Origin\",\n    \"x-stripe-priority-routing-enabled\": \"true\",\n    \"x-stripe-routing-context-priority-tier\": \"api-testmode\",\n    \"x-wc\": \"ABGHIJ\"\n  },\n  requestId: undefined,\n  statusCode: 403,\n  charge: undefined,\n  decline_code: undefined,\n  payment_intent: undefined,\n  payment_method: undefined,\n  payment_method_type: undefined,\n  setup_intent: undefined,\n  source: undefined\n}\n",
  "id": "745b4dd5-dd48-4b11-81f3-7e4dd98bc5f9",
  "metadata": [
    {
      "boot_time": null,
      "cpu_time_used": null,
      "deployment_id": "kbyqtgwxclmeujzrjlnt_97c613ee-924c-419b-b0f3-f75441c85df2_26",
      "event_type": "Log",
      "execution_id": "019920f9-1188-4ab1-8213-de317f4a8d28",
      "function_id": "97c613ee-924c-419b-b0f3-f75441c85df2",
      "level": "error",
      "memory_used": [],
      "project_ref": "kbyqtgwxclmeujzrjlnt",
      "reason": null,
      "region": "eu-central-1",
      "served_by": "supabase-edge-runtime-1.69.25 (compatible with Deno v2.1.4)",
      "timestamp": "2026-01-19T10:39:12.520Z",
      "version": "26"
    }
  ],
  "timestamp": 1768819152520000
}