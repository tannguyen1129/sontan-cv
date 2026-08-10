-- Run this entire file in Supabase SQL Editor.
-- The script is safe to run again when updating an existing project.

insert into storage.buckets (id, name, public)
values ('journey', 'journey', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view journey photos" on storage.objects;
drop policy if exists "Owner can upload journey photos" on storage.objects;
drop policy if exists "Owner can update journey photos" on storage.objects;
drop policy if exists "Owner can delete journey photos" on storage.objects;

create policy "Public can view journey photos"
on storage.objects for select to public
using (bucket_id = 'journey');

create policy "Owner can upload journey photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'journey' and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com');

create policy "Owner can update journey photos"
on storage.objects for update to authenticated
using (bucket_id = 'journey' and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com')
with check (bucket_id = 'journey' and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com');

create policy "Owner can delete journey photos"
on storage.objects for delete to authenticated
using (bucket_id = 'journey' and (auth.jwt() ->> 'email') = 'tandtnt15@gmail.com');

create table if not exists public.graduation_wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  message text not null check (char_length(message) between 3 and 500),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.graduation_wishes enable row level security;

drop policy if exists "Public can read approved wishes" on public.graduation_wishes;
drop policy if exists "Public can submit wishes" on public.graduation_wishes;
drop policy if exists "Owner can delete wishes" on public.graduation_wishes;

create policy "Public can read approved wishes"
on public.graduation_wishes for select to public
using (approved = true);

create policy "Public can submit wishes"
on public.graduation_wishes for insert to anon, authenticated
with check (approved = true and char_length(name) between 2 and 60 and char_length(message) between 3 and 500);

create policy "Owner can delete wishes"
on public.graduation_wishes for delete to authenticated
using ((auth.jwt() ->> 'email') = 'tandtnt15@gmail.com');

grant select, insert on public.graduation_wishes to anon, authenticated;
grant delete on public.graduation_wishes to authenticated;
