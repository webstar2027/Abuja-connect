-- Abuja Connect: additive profile photo support. Safe to run on the existing project.
-- Adds a gallery column and a private-per-user upload path in the public photo bucket.
alter table public.profiles add column if not exists additional_photo_urls text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Profile photos are publicly readable" on storage.objects;
create policy "Profile photos are publicly readable" on storage.objects for select using (bucket_id = 'profile-photos');

drop policy if exists "Members upload their own profile photos" on storage.objects;
create policy "Members upload their own profile photos" on storage.objects for insert to authenticated with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members update their own profile photos" on storage.objects;
create policy "Members update their own profile photos" on storage.objects for update to authenticated using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete their own profile photos" on storage.objects;
create policy "Members delete their own profile photos" on storage.objects for delete to authenticated using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
