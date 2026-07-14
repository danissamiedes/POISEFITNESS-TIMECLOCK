-- POISE Fitness Studio Time Clock — seed / setup helpers
-- Depends on the earlier files. This is OPTIONAL and interactive.
--
-- 1) Set the studio location + geofence (answer SPEC §11 Q1/Q2 first).
--    Replace the coordinates below with the real studio position.
update public.company_settings
set studio_name       = 'POISE Fitness Studio',
    studio_lat        = 40.416775,   -- TODO: real studio latitude
    studio_lng        = -3.703790,   -- TODO: real studio longitude
    geofence_radius_m = 150,
    block_out_of_range = false,
    require_photo      = true,
    require_location   = true,
    updated_at         = now()
where id = 1;

-- 2) Create the first admin.
--    Step A: create the auth user in the Supabase dashboard
--            (Authentication -> Users -> Add user, email + password),
--            or via the CLI. Copy their auth user id (a uuid).
--    Step B: link an employee row to that auth user with role = 'admin':
--
-- insert into public.employees (auth_user_id, full_name, email, role)
-- values ('00000000-0000-0000-0000-000000000000', 'Studio Manager', 'manager@example.com', 'admin')
-- on conflict (email) do update
--   set auth_user_id = excluded.auth_user_id,
--       role = 'admin',
--       active = true;
--
-- After that, the admin can create the rest of the team from /admin/employees.
