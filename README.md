# Abuja Connect — GitHub + Render + Supabase starter

This project can run on Render as a Node web service and can also be published as static files through GitHub Pages. Supabase provides authentication and database services.

## Easiest recommended setup: GitHub + Render + Supabase

### 1. Upload the project to GitHub
Upload/commit the contents of this project folder (including `package.json`, `server.js`, `public/`, and `supabase/`) to your Abuja Connect repository. Do not upload `.env` files or secret keys.

### 2. Deploy on Render
Create or update a **Web Service** connected to your GitHub repository. Use:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

If the project is inside a subfolder in the repository, set Render's **Root Directory** to that folder.

In Render → your service → **Environment**, add:
- `SUPABASE_URL` = your Supabase Project URL
- `SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key (or legacy anon key)

Save changes and redeploy. The Node server serves `/config.js` using these environment variables. These two values are browser-safe Supabase credentials; never use a `sb_secret_` or `service_role` key here.

### 3. Supabase authentication URLs
In Supabase → Authentication → URL Configuration:
- Site URL: your exact Render HTTPS URL, e.g. `https://your-service.onrender.com`
- Redirect URLs: add that exact URL. Add `https://your-service.onrender.com/**` if supported/needed for callback paths.

Enable Email provider and email confirmation if you want confirmed email addresses.

### 4. Set up the database schema
Review `supabase/schema.sql` carefully, then run it in the SQL Editor of the dedicated Abuja Connect Supabase project. Do not run it in a different project. It creates/updates the tables and policies for this starter; it is not a complete production launch. See the limitations below.

### 5. GitHub Pages option (static hosting)
GitHub Pages does not run `server.js` or read Render environment variables. If you also publish the `public/` folder using a static host, edit `public/config.js` and replace the two placeholders with the same Project URL and publishable key. Commit the change and publish the static files. Only the Project URL and publishable key belong there. Do not put database passwords, Supabase secret/service-role keys, or payment secret keys in browser files.

For a single main live website, use the Render URL as the canonical site and add it to Supabase URL Configuration. If you want to use GitHub Pages as a second live site too, add that Pages URL to Supabase Redirect URLs as well.

## What this starter currently includes
- Responsive landing/auth interface.
- Supabase email/password sign-up and login.
- Profile creation/discovery and starter like/match database logic.
- Database row-level security policies in `supabase/schema.sql`.

## Not production-complete yet
- Phone OTP/Sent.dm integration is not wired in yet.
- Password reset UI, email/phone dual verification flow, robust age verification, block/report/moderation, photo storage policies, rate limiting, and end-to-end testing remain to be completed.
- The chat panel is a design preview, not a full realtime chat product.
- Paystack checkout and trusted server-side payment verification are not implemented. Never mark users paid from browser code.
- Before public launch, review the schema and policies, test with test accounts, and arrange security testing.
