# Abuja Connect — Password Reset Update

This update adds a complete email-based password recovery flow using Supabase Auth.

## Files changed
- `public/app.js`: requests reset emails, handles Supabase PASSWORD_RECOVERY events, validates new passwords, updates the password, and returns users to login.
- `public/index.html`: adds the new-password and confirmation form.

## Deploy
Replace the matching files in your GitHub repository, commit, and wait for Render to deploy.

## Supabase configuration
1. Authentication → URL Configuration:
   - Site URL: `https://abujaconnect.onrender.com`
   - Add `https://abujaconnect.onrender.com/**` to Redirect URLs.
2. Authentication → Email Templates → Reset Password:
   - Subject: `Reset your Abuja Connect password`
   - Keep the confirmation link variable `{{ .ConfirmationURL }}` in the button URL.
3. Keep email confirmation enabled.

The website sends reset requests to the site origin. Supabase returns the user to the site with a recovery session. No SQL changes are required.

Never share SMTP credentials, API keys, or service-role keys.
