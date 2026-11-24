-- Abuja Connect: add optional gender field to existing profiles.
-- Run this once in Supabase SQL Editor before deploying the updated website.
alter table public.profiles
  add column if not exists gender text
  check (gender in ('woman','man','non_binary','prefer_not_to_say'));
