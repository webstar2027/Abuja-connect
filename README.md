# Abuja Connect Version 1 — visual redesign

This ZIP updates the existing Abuja Connect starter UI to follow the supplied reference: an Abuja-inspired hero, centered login/sign-up panel, white dashboard, profile cards, chat preview, account-type chooser, and subscription pricing.

## Files
- `public/index.html` — page structure and interface
- `public/styles.css` — responsive visual design
- `public/app.js` — UI-only preview interactions
- `public/assets/` — existing logo and poster asset
- `server.js` — existing static file server, unchanged
- `package.json` — existing package manifest, unchanged

## Important functionality status
This is still a front-end design preview. Login and registration do not save or send credentials. Profiles in the dashboard are sample placeholders, and likes, filters, matches, chat and subscriptions are demo interactions only. Paystack and Supabase are not connected by this redesign.

Before launch, implement and test Supabase Auth and database access, database row-level security, mutual matching and messaging rules, Paystack server-side payment verification, age confirmation and moderation/report/block features, plus server-side image resizing/compression and the 1 MB upload limit. Never put a Supabase secret/service-role key or Paystack secret key in browser JavaScript.

## Deploying the updated UI
1. Download and extract this ZIP.
2. Replace the matching files in the existing Abuja Connect GitHub repository (`public/index.html`, `public/styles.css`, `public/app.js`). Keep the current `server.js`, `package.json`, Supabase project and database unchanged.
3. Commit the changes to the existing Abuja Connect repository and wait for Render to redeploy.
4. Test desktop and mobile layouts. The current background uses the bundled poster SVG; replace it with a properly licensed, optimized Abuja MP4 only when ready to test video playback.

Do not use this ZIP to replace or modify the separate Abuja Meet project.
