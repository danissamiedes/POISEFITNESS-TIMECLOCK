# POISE Fitness Studio — Employee Time Clock (MVP)

A Progressive Web App that replaces the manual, tamper-prone staff time log.
Employees clock **in / out** from their phone; every punch captures a **front-camera
photo** and **GPS location**, and is **timestamped by the database** (never the client).
Managers review punches, geofence flags, and hours from an admin dashboard.

Built per [`SPEC.md`](./SPEC.md).

## Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **Leaflet + OpenStreetMap** for maps (no API key)
- PWA: web manifest + service worker (installable, HTTPS-only)

## Integrity guarantees (the whole point)

- **Server-set timestamps.** `punches.server_time` uses the DB `now()` default. The
  client cannot supply it. All punches flow through the `create_punch()` SQL function
  (SECURITY DEFINER), which also *derives* in/out from the last punch and *computes*
  the geofence distance server-side.
- **Write-once for employees.** RLS grants employees `SELECT` on **their own** punches
  only, and **no** `UPDATE`/`DELETE`. Photos upload to a private bucket with no
  overwrite/update/delete. The audit trail is immutable — corrections are meant to be
  additive, not edits.
- **Admin role is checked server-side** (`is_admin()` in SQL + `requireAdmin()` in
  server code), not merely hidden in the UI. The dashboard reads photos via short-lived
  signed URLs minted with the service role.
- **HTTPS only.** Camera + geolocation require a secure context; the clock UI refuses to
  operate otherwise.

## Project layout

```
supabase/            SQL you run once, in order:
  01_schema.sql        tables (employees, punches, company_settings)
  02_functions.sql     haversine_m, is_admin, current_employee_id, create_punch
  03_policies.sql      RLS + private 'punch-photos' storage bucket & policies
  04_seed.sql          set studio location + create the first admin (interactive)
src/
  app/
    login/             email + password sign-in
    page.tsx           employee clock screen (camera + GPS + punch)
    admin/             dashboard (punches, punch detail, payroll, settings, employees)
  components/          ClockCard, MapView, MapPicker, tables, forms, CSV export
  lib/                 supabase clients, auth guards, geo (haversine), shift pairing, csv
  middleware.ts        session refresh + route guards
public/                manifest.json, sw.js, icons
```

## Setup

### 1. Create a Supabase project

From the [Supabase dashboard](https://supabase.com), create a project. Then in the
**SQL Editor**, run the files in `supabase/` **in order**:

1. `01_schema.sql`
2. `02_functions.sql`
3. `03_policies.sql`
4. `04_seed.sql` — edit the studio coordinates first (see below), then run it.

`03_policies.sql` also creates the private **`punch-photos`** storage bucket and its
policies.

### 2. Set the studio location & create the first admin

Answer SPEC §11 Q1/Q2 (studio coordinates + radius) and edit the `update` at the top of
`04_seed.sql`. Then create your first admin:

1. **Authentication → Users → Add user** in the Supabase dashboard (email + password,
   mark email confirmed). Copy the new user's UUID.
2. Run the `insert into public.employees (...)` snippet at the bottom of `04_seed.sql`
   with that UUID and `role = 'admin'`.

After that, the admin can add the rest of the team from **/admin/employees** (which
provisions the auth user automatically).

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in from **Project Settings → API**:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **secret** — server only |
| `NEXT_PUBLIC_PHOTO_BUCKET` | `punch-photos` | must match `03_policies.sql` |

> The service-role key bypasses RLS. It is only ever imported into server code
> (`src/lib/supabase/admin.ts`, guarded by `requireAdmin()`), never into the browser.

### 4. Run

```bash
npm install
npm run dev            # http://localhost:3000  (localhost counts as a secure context)
```

Type-check / build:

```bash
npm run typecheck
npm run build
```

### 5. Deploy

- **Frontend:** Vercel — set the same env vars in the project settings.
- **Backend:** Supabase (managed).
- The camera/GPS flow needs **HTTPS**; Vercel provides this automatically. On localhost
  the browser treats `localhost` as secure, so the flow works in dev too.

## Using the app

**Employee (`/`)** — sign in, allow camera + location, tap the big **Clock In** /
**Clock Out** button. The correct action is shown based on your last punch. You get a
confirmation with the server timestamp; out-of-range punches are flagged for your manager.

**Admin (`/admin`)**

- **Punches** — all punches newest-first, filter by employee + date range, photo
  thumbnails, distance/geofence flags, CSV export. Click **View** for the full photo +
  map.
- **Payroll** — shift pairing (each clock-in with its next clock-out), total hours per
  employee for a week/period (decimal hours), with **This week / Last week** presets and a
  Monday/Sunday week-start toggle. Handles open shifts (in progress, not counted),
  double clock-ins, orphan clock-outs, and shifts crossing midnight. CSV export.
- **Employees** — add team members (creates their login), change roles, deactivate.
- **Settings** — studio name, location (click the map or type lat/long), geofence radius,
  and the `require_photo` / `require_location` / `block_out_of_range` toggles.

## Geofencing behavior

On each punch the DB computes the Haversine distance from the studio. If it exceeds
`geofence_radius_m` (default **150 m**), the punch is saved with `out_of_range = true`
so nothing is silently lost. Turn on **Block out-of-range punches** in Settings to reject
them outright instead.

## Out of scope for this MVP (see SPEC §10)

Biometric face **matching** (photos are captured for human review only), push
notifications, scheduling, payroll-system integration, multi-location, native apps, and an
offline punch queue. The data model leaves room to add these later.

## Open questions for the studio (SPEC §11)

1. Exact studio address / GPS coordinate (needed for the geofence — set in Settings).
2. Confirm the geofence radius (default 150 m).
3. Block or just flag out-of-range punches? (Default: flag.)
4. Payroll week start (Mon/Sun) and hours format. This build defaults to **Monday** and
   **decimal hours**; the week-start toggle is in the Payroll view.
5. Photo retention period and any consent notice to show before capture.
