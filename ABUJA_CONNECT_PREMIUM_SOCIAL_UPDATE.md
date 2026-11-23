# Abuja Connect Premium Social Update

## Access model
- Free accounts: registration/login, profile setup and photos, Discover, Encounters (Like/Pass), and mutual Matches.
- Premium accounts: all free features plus Messages/Chat.
- Message reads and message sends both require an active subscription in the database policies.
- Paystack subscription verification remains server-side; client users cannot write subscription records.
- Existing users, profiles, likes, matches, messages, and subscription records are retained.

## Database update order
If `free-social-access-migration.sql` has not yet been applied, run it first to enable free profile discovery, likes, and mutual matches. Then run `premium-messaging-migration.sql` to make messaging Premium-only. If the free social migration was already applied, run only the Premium Messaging migration.

These are policy/function migrations; they do not delete user data or drop tables. Review the migration before running it in the existing Supabase project. Back up the project first.


## Frontend behavior
- Authenticated users enter Discover without an active subscription check.
- Discover and Encounters remain free.
- Matches remain available to free users.
- The Messages view checks the server-side subscription status before listing conversations or loading messages.
- Non-Premium members see a Premium prompt with a link to the subscription plans and a retry-access-check control.
- Message submission checks Premium status on the client for feedback; Supabase RLS is the actual enforcement boundary.
