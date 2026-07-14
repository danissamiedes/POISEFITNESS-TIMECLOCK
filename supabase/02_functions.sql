-- POISE Fitness Studio Time Clock — functions
-- Depends on 01_schema.sql.

-- ---------------------------------------------------------------------------
-- Haversine distance in meters between two lat/lng points.
-- ---------------------------------------------------------------------------
create or replace function public.haversine_m(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
) returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians(lng2 - lng1) / 2), 2)
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- is_admin(): true if the current auth user is an active admin employee.
-- SECURITY DEFINER so it can read employees without tripping RLS recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    where auth_user_id = auth.uid()
      and role = 'admin'
      and active
  );
$$;

-- ---------------------------------------------------------------------------
-- current_employee_id(): id of the employee row for the current auth user.
-- ---------------------------------------------------------------------------
create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.employees where auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- create_punch(): the ONLY sanctioned path to record a punch.
--
-- Integrity guarantees:
--   * server_time is set by the table default now() — the client cannot set it.
--   * punch_type (in/out) is derived from the employee's last punch, not trusted
--     from the client.
--   * distance_m / out_of_range are computed server-side from company_settings.
--   * require_photo / require_location / block_out_of_range are enforced here.
--
-- SECURITY DEFINER: runs as the function owner so it can insert while the
-- punches table has no INSERT policy for regular users (defence in depth).
-- ---------------------------------------------------------------------------
create or replace function public.create_punch(
  p_photo_path  text,
  p_latitude    double precision,
  p_longitude   double precision,
  p_accuracy_m  double precision,
  p_device_info text
) returns public.punches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee   public.employees;
  v_settings   public.company_settings;
  v_last_type  text;
  v_next_type  text;
  v_distance   double precision;
  v_out        boolean := false;
  v_result     public.punches;
begin
  -- Resolve the caller's employee record.
  select * into v_employee
  from public.employees
  where auth_user_id = auth.uid();

  if v_employee.id is null then
    raise exception 'No employee record is linked to this account.'
      using errcode = 'P0001';
  end if;

  if not v_employee.active then
    raise exception 'This employee account is deactivated.'
      using errcode = 'P0001';
  end if;

  select * into v_settings from public.company_settings where id = 1;

  -- Enforce photo / location requirements.
  if v_settings.require_photo and (p_photo_path is null or length(trim(p_photo_path)) = 0) then
    raise exception 'A photo is required to punch.'
      using errcode = 'P0001';
  end if;

  if v_settings.require_location and (p_latitude is null or p_longitude is null) then
    raise exception 'Location is required to punch.'
      using errcode = 'P0001';
  end if;

  -- Derive in/out from the last punch.
  select punch_type into v_last_type
  from public.punches
  where employee_id = v_employee.id
  order by server_time desc
  limit 1;

  if v_last_type is null or v_last_type = 'out' then
    v_next_type := 'in';
  else
    v_next_type := 'out';
  end if;

  -- Geofence distance.
  if p_latitude is not null and p_longitude is not null
     and v_settings.studio_lat is not null and v_settings.studio_lng is not null then
    v_distance := public.haversine_m(
      v_settings.studio_lat, v_settings.studio_lng, p_latitude, p_longitude
    );
    v_out := v_distance > v_settings.geofence_radius_m;
  end if;

  if v_settings.block_out_of_range and v_out then
    raise exception 'Punch rejected: you are % m from the studio (limit % m).',
      round(v_distance)::int, v_settings.geofence_radius_m
      using errcode = 'P0001';
  end if;

  insert into public.punches (
    employee_id, punch_type, photo_path,
    latitude, longitude, accuracy_m,
    distance_m, out_of_range, device_info
  ) values (
    v_employee.id, v_next_type, p_photo_path,
    p_latitude, p_longitude, p_accuracy_m,
    v_distance, v_out, p_device_info
  )
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.create_punch(text, double precision, double precision, double precision, text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.haversine_m(double precision, double precision, double precision, double precision) to authenticated;
