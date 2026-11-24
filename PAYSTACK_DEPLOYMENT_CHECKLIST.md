# Paystack deployment and testing checklist
## Render environment
Required:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY (private, server only)
- PAYSTACK_SECRET_KEY (private, server only)
- APP_URL=https://abujaconnect.onrender.com
Optional:
- PAYSTACK_WEBHOOK_SECRET

## Paystack webhook
Full endpoint: https://abujaconnect.onrender.com/api/payments/paystack-webhook
Configure charge.success. Keep test mode enabled until verified.

## Payment flow
Signed-in member -> server creates pending subscription -> Paystack hosted checkout -> callback verifies transaction and identity/plan/amount -> server activates -> webhook provides additional confirmation. Renewals extend from a valid existing expiry. These are fixed-term purchases, not auto-renewing card charges.

## Test cases
- Verify each regular and escort plan amount.
- Pending, failed, cancelled, or invalid payment must not activate.
- Correct user/reference/amount/currency/plan must be required.
- Active subscribers can read/send messages only in their mutual matches.
- Free users can use profile, Discover, Encounters, likes and Matches.
- Expired members cannot read/send messages.
- Duplicate webhook/callback does not extend subscription twice.
- Confirm profile photo upload and responsive behavior.
Do not switch Paystack to live mode until test transactions and webhook checks pass.
