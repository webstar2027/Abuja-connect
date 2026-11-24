# Abuja Connect Premium Social Update — Historical
This document describes the Premium-only messaging access model retained in the current rebuild.
For a fresh database, use the consolidated `supabase/schema.sql` only. The old incremental migration files are preserved under `supabase/archive/` and should not be applied to a fresh database.
Current access: free profile, Discover, Encounters/likes and Matches; Premium required for message reads and sends. Paystack checkout and subscription verification are server-side.
