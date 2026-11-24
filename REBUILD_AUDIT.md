# Abuja Connect source audit and rebuild report

## Files audited
All 25 entries in the supplied ZIP were inspected: root configuration and package files, public HTML/CSS/JS/config assets, backend Node server, project README and design/payment notes, and every SQL file in `supabase/`.

## Confirmed structural problems
1. **Premium navigation mismatch:** the plans markup was a public/main section outside the logged-in dashboard, but authenticated CSS hides sections outside the member dashboard. The old CTA only scrolled to that section. This was a direct reason for the blank/hidden subscription screen.
2. **Stylesheet layering:** `public/styles.css` contained many appended overrides and contradictory authenticated-state declarations (dark, red, and white themes) rather than a single predictable cascade. It was replaced by one consolidated responsive stylesheet.
3. **Premium screen placement:** plans now exist as a dashboard view (`data-panel="premium"`) with navigation state, so it is not hidden by the authenticated-section filter.
4. **CTA wiring:** lock screen subscription CTAs now route to the dashboard Premium view. The back action returns to Messages. Plan buttons retain server-side checkout initialization.
5. **Access documentation conflict:** older notes alternately described free messaging and Premium messaging. Current rules are consistent: free Discover/Encounters/likes/matches; Premium message read and send.
6. **Database setup duplication:** incremental migrations previously required different orders and could conflict. `supabase/schema.sql` is now the single consolidated setup for a clean database. Older SQL is preserved in `supabase/archive/` and marked historical.
7. **Photo fields:** the consolidated schema includes `gender` and `additional_photo_urls` and photo-storage setup so onboarding/profile forms have matching database columns.
8. **Profile signup trigger:** the fresh schema trigger now copies allowed gender metadata and default city/account type into the initial profile row.

## File layout in rebuilt package
- `public/index.html` — auth, onboarding, dashboard views, and premium plan view.
- `public/app.js` — auth/profile/discovery/encounter/likes/matches/messages/payment-return logic.
- `public/styles.css` — new single stylesheet, light theme and responsive layouts.
- `public/config.js` — safe empty fallback; Render `/config.js` injects public config.
- `server.js` — existing secure server-side Paystack integration retained; `/healthz` health endpoint added.
- `supabase/schema.sql` — consolidated clean database schema.
- `supabase/archive/` — legacy SQL preserved for review, not for fresh setup.

## Verification completed
- Original ZIP integrity check passed.
- JavaScript syntax checks (`node --check`) passed for both frontend and server.
- HTML parsed; no duplicate IDs found.
- Static local asset references resolved.
- JavaScript static ID references checked; only dynamic encounter-card IDs are created at runtime.
- CSS brace balance verified.
- Consolidated SQL was checked for policy drop/create pairing and no `DROP TABLE` or `DELETE` statements.
- Local HTTP smoke checks returned 200 for `/`, `/styles.css`, `/app.js`, `/config.js`, `/healthz`, and `/api/payments/config-check`.

## Not yet verified
- No real Supabase login or database queries were run.
- No real Paystack test payment or webhook was run.
- No browser automation screenshot test was run.


## Frontend navigation/chat revision
- Added desktop sidebar collapse/expand button and compact icon-only state.
- Added a searchable match list to Messages.
- Conversation selection opens a focused chat view with a Back control (mobile switches between inbox and conversation).
- Free users retain access to their match list; the selected conversation displays a Premium lock/CTA and the message composer is disabled/hidden. Premium status is checked before loading message history or enabling sending.
- The Supabase schema, server payment routes, and secrets/config files were not changed by this UI revision.
- Syntax checks: `node --check public/app.js` and `node --check server.js` passed. HTML ID check found no duplicate IDs. CSS parse check reported no syntax errors. Browser visual testing was not completed in this environment.
