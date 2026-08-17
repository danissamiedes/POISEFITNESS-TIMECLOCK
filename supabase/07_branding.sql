-- POISE Fitness Studio Time Clock — uploadable logo / branding
-- Adds a logo_url to company_settings and a public storage bucket to hold the
-- uploaded logo. The logo is served publicly so it can appear on the login
-- screen (which is unauthenticated). Uploads happen server-side via the
-- service role (admin-only), so no storage RLS policies are required here.

alter table public.company_settings
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;
