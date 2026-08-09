-- Run once in the Supabase SQL Editor.
-- Create the admin account in Authentication > Users using the email in ADMIN_EMAIL.

insert into storage.buckets (id, name, public)
values ('journey', 'journey', true)
on conflict (id) do update set public = true;

create policy "Public can view journey photos"
on storage.objects for select
to public
using (bucket_id = 'journey');

create policy "Owner can upload journey photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'journey'
  and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com'
);

create policy "Owner can update journey photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'journey'
  and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com'
)
with check (
  bucket_id = 'journey'
  and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com'
);

create policy "Owner can delete journey photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'journey'
  and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com'
);
