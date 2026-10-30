# Abuja Connect — GitHub + Render + Supabase

This package contains the Abuja Connect redesign based on the original visual blueprint and the latest red-edition project files. The public experience is a full-screen Abuja landmark slideshow with one centered Login / Sign Up card. Existing users go directly to the social dashboard after login; first-time registrants complete the Welcome / Profile Setup screen before entering the dashboard.

## Deploy on Render

Create a **Web Service** (not a Static Site), connect this GitHub repository, and set:

- **Runtime:** Node
- **Build Command:** leave blank
- **Start Command:** `npm start`
- **Instance type:** Free, if offered

Add these Environment Variables in Render → your service → **Environment**:

- `SUPABASE_URL` = your Supabase Project URL
- `SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key (or legacy anon key)

Do not add a database password, `service_role` key, or Supabase secret key to these variables. The publishable key is intended for browser use; database access must be protected by Row Level Security (RLS).

After saving environment variables, redeploy. Visit `https://YOUR-RENDER-HOST/config.js` to check that the endpoint returns `window.ABUJA_CONFIG` with your project URL and a publishable key. Do not share that URL's contents publicly if you prefer not to.

## Supabase setup

1. Create/select a dedicated Supabase project for Abuja Connect.
2. In Authentication settings, enable Email sign-ups and email confirmation.
3. In Authentication → URL Configuration, set Site URL to your exact Render URL and add that URL to Redirect URLs (for example `https://YOUR-RENDER-HOST/**` if wildcard paths are supported).
4. Open SQL Editor and review/run `supabase/schema.sql` in the Abuja Connect project only. It creates profiles, subscriptions, likes, matches, and messages with RLS policies. Do not run it in another project.

## GitHub update

Extract the ZIP and upload/commit the contents of the `abuja-connect-work` folder into the root of your existing Abuja Connect repository so `package.json`, `server.js`, `public/`, and `supabase/` are at the repository root. Keep a backup or use a branch before replacing files.

## Updated user journey

- Public visitors see only the full-screen changing Abuja background and centered authentication card. Login and Sign Up are tabs in the same card.
- Successful login checks for an existing profile and routes returning members directly to the dashboard.
- Successful first-time registration routes to Welcome / Profile Setup. The profile is saved to the `profiles` table before the dashboard opens.
- If email confirmation is enabled and Supabase does not create a session immediately, the visitor is asked to confirm their email and then log in; a missing profile routes them to setup.
- The profile setup form collects display name, gender, city, about text, and interests.

## What is and isn't implemented

- Email/password registration and login through Supabase are implemented in the frontend, subject to correct Supabase settings and the schema being applied.
- New user profile creation and basic profile discovery/likes/mutual matches are connected to the supplied SQL schema.
- `public/config.js` is served dynamically by `server.js` on Render from the two environment variables above.
- Sent.dm phone OTP, Google OAuth provider setup, Paystack checkout, full real-time messaging UI, image upload, reporting/moderation, and production hardening are not fully implemented/configured. Do not advertise those as active until separately completed and tested.

## Important

- Do not expose Supabase secret/service-role keys in frontend code or GitHub.
- Supabase publishable keys are public by design, but RLS policies and auth rules must be configured correctly.
- Test with a new test account and email before inviting real users.
