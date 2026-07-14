-- POISE Fitness Studio Time Clock — schema
-- Run this in the Supabase SQL editor (or via the CLI) for a fresh project.
-- Order matters: schema -> functions -> policies -> seed.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  full_name     text not null,
  email         text unique not null,
  role          text not null default 'employee' check (role in ('employee', 'admin')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists employees_auth_user_id_idx on public.employees (auth_user_id);

-- ---------------------------------------------------------------------------
-- punches
-- server_time is ALWAYS set by the DB default now(); it is never accepted
-- from the client. There is no UPDATE/DELETE path for employees (see RLS).
-- ---------------------------------------------------------------------------
create table if not exists public.punches (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  punch_type    text not null check (punch_type in ('in', 'out')),
  server_time   timestamptz not null default now(),
  photo_path    text,
  latitude      double precision,
  longitude     double precision,
  accuracy_m    double precision,
  distance_m    double precision,
  out_of_range  boolean not null default false,
  device_info   text,
  created_at    timestamptz not null default now()
);

create index if not exists punches_employee_time_idx on public.punches (employee_id, server_time desc);
create index if not exists punches_time_idx on public.punches (server_time desc);

-- ---------------------------------------------------------------------------
-- company_settings (single row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.company_settings (
  id                  int primary key default 1 check (id = 1),
  studio_name         text not null default 'POISE Fitness Studio',
  studio_lat          double precision,
  studio_lng          double precision,
  geofence_radius_m   int not null default 150,
  block_out_of_range  boolean not null default false,
  require_photo       boolean not null default true,
  require_location    boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- Ensure the singleton row exists.
insert into public.company_settings (id) values (1)
on conflict (id) do nothing;
