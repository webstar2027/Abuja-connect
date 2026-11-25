# Abuja Connect Free Social Update — First Stage

## Changes in this package
- Removes the subscription-status check from existing-user dashboard routing.
- After required profile setup, new members enter the app without subscription verification.
- Adds an Encounters tab with one-profile-at-a-time Like/Pass flow.
- Core profile discovery, likes, matches and match-based messaging are intended to be free.
- Retains Paystack backend files and subscription records for optional premium features.
- Adds a new additive Supabase migration to replace the paid-access policies.

## Before deploying
1. Back up your repository ZIP and avoid deleting your existing Supabase project.
2. Upload the package contents to GitHub, preserving the `public`, `supabase`, and root files.
3. In Supabase SQL Editor, run `supabase/free-social-access-migration.sql` after the previously applied Paystack subscription-gates migration.
4. Deploy from GitHub to Render.
5. Test with an existing member and a second test account: login, discover, Like, mutual match, free message, and profile edit.


## Important scope
This stage makes access free and adds the Encounters front-end. Free messaging still requires a mutual match in this version. A separate direct-message system (chat before matching) needs a schema and app flow addition, and is not included in this first package.

## Data preservation
The migration uses `DROP POLICY` / `CREATE POLICY` to update access rules and replaces the mutual-match trigger function. It does not delete rows or drop tables. Do not run the original full schema over production as a reset.
