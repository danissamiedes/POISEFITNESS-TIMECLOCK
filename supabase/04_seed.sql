-- POISE Fitness Studio Time Clock — seed / setup helpers
-- Depends on the earlier files. Run this LAST.

-- ---------------------------------------------------------------------------
-- 1) Studio location + geofence.
--
-- Radius is 50 m and out-of-range punches are FLAGGED (not blocked), per setup.
--
-- The exact studio coordinates are easiest to set AFTER deploy: sign in as the
-- admin, open /admin/settings, and click your studio on the map (recommended).
-- If you'd rather set them here: open Google Maps, right-click the studio, click
-- the "lat, long" shown at the top of the menu to copy it, and paste below —
-- then change the two NULLs to those numbers.
-- ---------------------------------------------------------------------------
update public.company_settings
set studio_name        = 'POISE Fitness Studio',
    studio_lat         = NULL,   -- e.g. 25.276987  (or set on the map in /admin/settings)
    studio_lng         = NULL,   -- e.g. 55.296249
    geofence_radius_m  = 50,
    block_out_of_range = false,  -- flag out-of-range punches for review, don't block
    require_photo      = true,
    require_location   = true,
    updated_at         = now()
where id = 1;

-- ---------------------------------------------------------------------------
-- 2) First admin: dm@bookkeepingpoint.com
--
-- Step A: create the auth user in the Supabase dashboard
--         Authentication -> Users -> Add user
--           Email:  dm@bookkeepingpoint.com
--           Password: (choose one — you'll use it to sign in)
--           ✓ Auto Confirm User
--         Then copy that user's User UID (a uuid).
--
-- Step B: paste the UID below (replace PASTE-ADMIN-AUTH-USER-UID) and run this:
-- ---------------------------------------------------------------------------
-- insert into public.employees (auth_user_id, full_name, email, role, active)
-- values ('PASTE-ADMIN-AUTH-USER-UID', 'Studio Manager', 'dm@bookkeepingpoint.com', 'admin', true)
-- on conflict (email) do update
--   set auth_user_id = excluded.auth_user_id,
--       role   = 'admin',
--       active = true;

-- After that, sign in at your deployed URL, set the studio location on the map
-- in /admin/settings, and add the rest of the team from /admin/employees.
