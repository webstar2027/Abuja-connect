# Abuja Connect Professional Starter

This bundle upgrades the visual interface and adds a first Supabase authentication/profile-discovery integration plus an idempotent schema for a NEW Abuja Connect Supabase project. It does not touch Abuja Meet.

## Before deploying
1. Open `public/config.js` and replace the two placeholders with your Abuja Connect **Project URL** and **publishable key** only. Never put a `sb_secret_` or `service_role` key in a public file.
2. In the Supabase dashboard for the separate Abuja Connect project, open SQL Editor and run `supabase/schema.sql`. It creates tables/policies if missing and does not drop tables. Review before running; do not run it in Abuja Meet.
3. Commit the changed `public/index.html`, `public/styles.css`, `public/app.js`, `public/config.js`, and `supabase/schema.sql` to the existing Abuja Connect GitHub repository. Keep your Render service settings and separate Abuja Meet untouched.
4. Verify email confirmation settings in Supabase Auth, then test signup and login using a test email.

## Implemented in this starter
- Professional responsive landing page/dashboard styling.
- Supabase email/password sign-up and login when `public/config.js` is configured.
- Profile creation trigger and authenticated profile discovery.
- Like records and mutual-match creation trigger.
- Database row-level security for profiles, likes, matches, subscriptions and messages.
- Message insert policy requires an active subscriber and a mutual match. Therefore an unsubscribed recipient can read incoming messages but cannot reply until subscribed.

## Still required before calling it production-ready
- The visible chat panel is still a design preview; a full real conversation UI with conversation list, realtime updates, unread counts and safe recipient selection remains to be built.
- Paystack checkout, server-side signature/transaction verification, and trusted subscription activation endpoint are not included. Do not activate subscriptions manually from browser code.
- Photo uploads/storage policies, server-side image compression/1 MB enforcement, block/report/admin moderation, robust age verification, password reset, rate limiting, and end-to-end testing are still required.
- The browser UI is not a replacement for backend enforcement. Never expose Supabase secret/service-role or Paystack secret keys.

## Subscription prices
Regular: ₦1,000 / 1 month, ₦2,700 / 3 months, ₦5,000 / 6 months, ₦9,000 / 1 year.
Escort listing: ₦2,000 / 1 month, ₦5,400 / 3 months, ₦10,000 / 6 months, ₦18,000 / 1 year.
