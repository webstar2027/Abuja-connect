# Abuja Connect Paystack rollout checklist

This ZIP contains the Paystack integration code, but **it is not live until you deploy it and set the server secrets**. Do not put secret keys in `public/config.js`, frontend JavaScript, or GitHub.


## 1. Render environment variables

In Render -> Abuja Connect service -> Environment, add:

- `SUPABASE_URL` — existing Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` — existing browser-safe/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (server-only; never share or commit)
- `PAYSTACK_SECRET_KEY` — Paystack secret key (`sk_test_...` while testing)
- `APP_URL` — `https://abujaconnect.onrender.com`
- `PAYSTACK_WEBHOOK_SECRET` — optional modern webhook signing secret (`whsec_...`)

Keep `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, and `PAYSTACK_WEBHOOK_SECRET` private.


## 2. Supabase security SQL

Before deploying to real members, export/backup your current database and review your existing RLS policies. Then run `supabase/paystack-subscription-gates.sql` in Supabase SQL Editor. It is additive and updates policies/functions; it does not delete user records or tables. It assumes the tables/functions in your current schema are present.


## 3. Paystack settings

Use Paystack Test Mode first. Set the webhook endpoint to:


`https://abujaconnect.onrender.com/api/payments/paystack-webhook`

Subscribe it to `charge.success`. Use Paystack's test credentials to test payment completion, failed payment, callback verification, and webhook delivery. The endpoint supports legacy signature header and the modern signature if `PAYSTACK_WEBHOOK_SECRET` is configured.


## 4. How the checkout works

- User signs in and chooses their account category and plan.
- Abuja Connect's server calculates the amount (frontend prices are never trusted) and creates a pending subscription.
- Server initializes Paystack and redirects to its hosted checkout.
- On return, the server verifies the transaction reference and checks NGN amount, reference, account, and plan metadata before activating access.
- The webhook is a second verification path. Activation is idempotent; duplicate webhook/callbacks do not grant extra time.
- If a member buys another term before their current term expires, the new term extends from the current expiry.

These plans are **fixed-term one-time payments**, not automatic recurring card charges. Members renew by purchasing another term.


## 5. Test checklist

- Test regular and escort plan amounts for each term.
- A failed, pending, or cancelled checkout must not activate a subscription.
- Confirm successful checkout activates the selected plan for the correct account.
- Try a wrong-account payment reference: it must not activate access.
- Confirm unpaid users are denied access to profile discovery, likes, matches, and message reading/writing by RLS.
- Confirm active users can use the paid features, and expired users are denied.
- Confirm webhook retries do not add the subscription period more than once.
- Test on mobile and desktop after deployment.

Do not switch to Paystack Live Mode until these tests pass.
