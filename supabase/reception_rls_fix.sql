-- Fix for the Receptions page RLS error.
-- The page writes, in order:
--   1) Storage bucket `photos` (storage.objects rows under receptions/*)
--   2) table `photos`
--   3) table `receptions`
-- If `receptions` already has RLS disabled, the common failing write is the `photos` table
-- or the Storage object insert performed by Supabase Storage.

-- Keep the business tables used by the reception workflow open to the anon client.
alter table if exists public.receptions disable row level security;
alter table if exists public.photos disable row level security;

-- Make sure the public photo bucket exists and remains public.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = excluded.public;

-- Storage uses RLS on storage.objects. These policies allow the app to upload/read/update
-- files in the public `photos` bucket, including paths like receptions/<timestamp>-file.jpg.
drop policy if exists "Public read photos bucket" on storage.objects;
create policy "Public read photos bucket"
on storage.objects
for select
to public
using (bucket_id = 'photos');

drop policy if exists "Public upload photos bucket" on storage.objects;
create policy "Public upload photos bucket"
on storage.objects
for insert
to public
with check (bucket_id = 'photos');

drop policy if exists "Public update photos bucket" on storage.objects;
create policy "Public update photos bucket"
on storage.objects
for update
to public
using (bucket_id = 'photos')
with check (bucket_id = 'photos');
