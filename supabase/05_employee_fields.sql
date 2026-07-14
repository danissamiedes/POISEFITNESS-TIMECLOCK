-- POISE Fitness Studio Time Clock — employee personal-info fields
-- Adds address, hire date, pay rate, and free-text notes to employees.
-- Safe to run on an existing database (idempotent).

alter table public.employees
  add column if not exists address    text,
  add column if not exists date_hired date,
  add column if not exists pay_rate   numeric(10, 2),
  add column if not exists notes      text;

-- These are admin-managed via the existing employees_admin_update RLS policy;
-- no new policies are required.
