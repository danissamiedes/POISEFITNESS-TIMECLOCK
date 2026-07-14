-- POISE Fitness Studio Time Clock — Row Level Security
-- Depends on 01_schema.sql and 02_functions.sql.
--
-- Security model:
--   employees        : self-read; admins read/write all.
--   punches          : employees read ONLY their own; admins read all.
--                      NO update / delete for anyone (immutable audit trail).
--                      INSERT happens exclusively through create_punch()
--                      (SECURITY DEFINER), so no INSERT policy is granted.
--   company_settings : any authenticated user reads; only admins update.

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
alter table public.employees enable row level security;

drop policy if exists employees_select_self_or_admin on public.employees;
create policy employees_select_self_or_admin
  on public.employees for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists employees_admin_insert on public.employees;
create policy employees_admin_insert
  on public.employees for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists employees_admin_update on public.employees;
create policy employees_admin_update
  on public.employees for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy: employees are deactivated (active = false), never deleted.

-- ---------------------------------------------------------------------------
-- punches — read only, and only your own (admins read all).
-- ---------------------------------------------------------------------------
alter table public.punches enable row level security;

drop policy if exists punches_select_own_or_admin on public.punches;
create policy punches_select_own_or_admin
  on public.punches for select
  to authenticated
  using (
    public.is_admin()
    or employee_id = public.current_employee_id()
  );

-- Deliberately NO insert / update / delete policies for authenticated users.
-- Inserts flow through public.create_punch(); the audit trail is immutable.

-- ---------------------------------------------------------------------------
-- company_settings
-- ---------------------------------------------------------------------------
alter table public.company_settings enable row level security;

drop policy if exists company_settings_select on public.company_settings;
create policy company_settings_select
  on public.company_settings for select
  to authenticated
  using (true);

drop policy if exists company_settings_admin_update on public.company_settings;
create policy company_settings_admin_update
  on public.company_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket: punch-photos (private)
-- Create the bucket (id must match NEXT_PUBLIC / server code):
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('punch-photos', 'punch-photos', false)
on conflict (id) do nothing;

-- Employees may upload (insert) into a folder named after their employee id,
-- e.g.  <employee_id>/<timestamp>.jpg . They cannot update or delete objects,
-- and cannot read them back — the dashboard serves photos via signed URLs
-- minted server-side with the service role.

drop policy if exists punch_photos_insert on storage.objects;
create policy punch_photos_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'punch-photos'
    and (storage.foldername(name))[1] = public.current_employee_id()::text
  );

-- Admins may read objects directly (dashboard fallback / debugging).
drop policy if exists punch_photos_admin_read on storage.objects;
create policy punch_photos_admin_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'punch-photos' and public.is_admin());

-- No update / delete policies: photos are write-once.
