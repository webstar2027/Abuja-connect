# Abuja Connect – Telegram layout and payment verification updates

## Telegram Mini App
- Telegram-specific responsive rules now override wide WebView viewport breakpoints.
- Discover profile cards use a full-width, single-column layout on Telegram.
- Photo area and Like/Pass buttons resize for phone screens.
- Bottom navigation is forced visible, fixed to the bottom, and uses safe-area padding.

## Paystack verification
- Verification remains strict: subscription activates only for a successful NGN transaction with exact expected amount and matching reference.
- Failure messages now distinguish invalid plan, amount mismatch, currency mismatch, and unsuccessful Paystack status.
- The error explicitly advises users not to repeat a payment if they may have been debited.

## Deploy and verify
- `node --check server.js` and `node --check public/app.js` passed.
- Telegram rendering and Paystack transactions still require live-device/live-payment testing. Do not make another payment merely to test; first check the Paystack dashboard transaction for the previously paid reference.
- No database schema or user data was changed.
