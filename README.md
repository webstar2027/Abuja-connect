# Abuja Connect — Rebuilt Project Package

This is the rebuilt Abuja Connect website project. It includes the browser frontend, Node server, secure Paystack API routes, and a consolidated Supabase schema.

## Project layout
- `server.js` — static site server, Supabase auth token validation, Paystack initialization/verification/webhook APIs.
- `public/index.html` — landing/auth screen, onboarding, member dashboard, Discover, Encounters, Matches, Messages, Premium plans.
- `public/app.js` — frontend state, auth, profile, likes, matches, Premium checkout and messaging access.
- `public/styles.css` — clean responsive white/light visual system; replaces the previous accumulated CSS patches.
- `public/config.js` — local empty fallback only. Render dynamically serves `/config.js` from environment variables.
- `supabase/schema.sql` — consolidated, rerunnable setup for a **fresh database**. It includes the core tables, Premium messaging RLS and profile-photo storage.
- `supabase/archive/` — prior incremental SQL files preserved for reference. Do not run these on top of the new consolidated schema unless we explicitly review them.

## Render environment
Required server variables:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never place in public files/GitHub)
- `PAYSTACK_SECRET_KEY` (server only)
- `APP_URL` = your deployed website URL

Optional:
- `PAYSTACK_WEBHOOK_SECRET`

Set Render Start Command to `npm start`. Node 18 or newer is required.

## Fresh Supabase setup
If creating a **brand-new Supabase project/database**, open SQL Editor and run `supabase/schema.sql` once. This script is written to be rerunnable and does not issue DROP TABLE or DELETE commands.

**Data-loss warning:** deleting or replacing the existing Supabase project/database will delete its Auth users and records. The website ZIP cannot restore account passwords or unknown tables such as any legacy `lives` table. Do not delete your existing database until you are certain you want a clean test project.

After running the consolidated schema, create/confirm email auth settings and Storage bucket policies, then set Render environment variables. Run a test account before live traffic.

## Current access rules
- Signup/login: email + password.
- Discovery, likes/encounters, and mutual matches: free.
- Messages: both message reads and sending are gated by active Premium, enforced by database RLS.
- Premium term pricing is server-defined and checkout is verified server-side by Paystack.
- Plan terms are fixed-duration purchases; renewals extend an existing valid term.

## Paystack pricing
Regular: 1 month ₦1,000; 3 months ₦2,700; 6 months ₦5,000; 1 year ₦9,000.
Escort: 1 month ₦2,000; 3 months ₦5,400; 6 months ₦10,000; 1 year ₦18,000.

## Webhook
Paystack endpoint: `/api/payments/paystack-webhook` (set the full URL in Paystack).
Handle `charge.success` events. Do not use live mode until successful test transactions and webhook verification have been exercised.

## Legacy SQL
Previous migration files are in `supabase/archive/` for reference only. The clean setup should use the consolidated `schema.sql`, not the archived migrations.
