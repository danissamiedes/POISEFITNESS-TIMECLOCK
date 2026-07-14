# SPEC.md — POISE Fitness Studio Employee Time Clock (MVP)

## 1. Goal

Replace the manual, tamper-prone employee time log at **POISE Fitness Studio** with a
web app that lets staff **clock in and clock out**, capturing a **face photo** and
**GPS location** on every punch. Managers review all entries, hours, and locations from
an **admin dashboard**. Punches made outside the studio are flagged (**geofencing**).

**Primary problem being solved:** manual records can be lost or manipulated. Every punch
must therefore be **timestamped by the server**, tied to an identity, and backed by a
photo + location that the employee cannot edit after the fact.

## 2. Target users

| Role | What they do |
|------|--------------|
| **Employee** | Opens the app on their phone, logs in, taps Clock In / Clock Out. Camera + location fire automatically. |
| **Manager / Admin** | Logs into a dashboard. Reviews punches (with photo + map), sees flagged out-of-range punches, checks hours worked, exports for payroll. |

Assume a small team (5–30 employees). No public sign-up — the admin creates employee accounts.

## 3. Platform & tech stack

Build a **Progressive Web App (PWA)** — runs in the phone browser, installable to the
home screen, no app store needed.

**Recommended stack:**

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend / DB / Auth / Storage:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **Camera:** browser `getUserMedia` (front camera) → capture still frame → upload to Supabase Storage
- **Location:** browser `navigator.geolocation.getCurrentPosition`
- **Maps in dashboard:** Leaflet + OpenStreetMap tiles (free, no API key)
- **Hosting:** Vercel (frontend) + Supabase (managed backend)
- **PWA:** web manifest + service worker (installable, works over HTTPS)

**Non-negotiable constraints:**
- All punch timestamps are set by the **server/database**, never trusted from the client.
- Photos and coordinates are **write-once** for employees — they cannot edit or delete
  their own punches after submitting.
- The app must be served over **HTTPS** (camera + geolocation require a secure context).

## 4. Core features (MVP scope)

### 4.1 Photo + GPS on every punch
- On Clock In and Clock Out, the app requests camera + location permission.
- It captures one still photo from the **front (selfie) camera** and reads latitude/longitude
  (plus accuracy in meters).
- Photo is uploaded to storage; the punch record stores the photo reference + coordinates.
- If the employee denies camera or location, the punch is **blocked** with a clear message
  explaining both are required. (Configurable per company setting — see 4.3.)

### 4.2 Manager admin dashboard
- List of all punches, newest first, filterable by employee and date range.
- Each row shows: employee name, In/Out, server timestamp, thumbnail photo, location
  (map pin + reverse-geocoded or raw lat/long), and a flag if out of geofence.
- Click a row to see the full photo and a map view.
- Export the current filtered view to **CSV**.

### 4.3 Geofencing (studio radius)
- Company settings store the studio's **latitude, longitude, and allowed radius (meters)**
  — default 150 m.
- On each punch, compute distance from the studio (Haversine). If beyond the radius, the
  punch is **saved but flagged** `out_of_range = true`.
- Setting `block_out_of_range` (default false) can be turned on to reject out-of-range punches.
- Setting `require_photo` and `require_location` (both default true) control 4.1 enforcement.

### 4.4 Hours / payroll summary
- Pair each Clock In with the next Clock Out for that employee to form a **shift**.
- Compute hours worked per shift, per day, and per week per employee.
- Dashboard "Payroll" view: table of employee × period with total hours; export to CSV.
- Handle edge cases: missing clock-out (open shift → show as "in progress", not counted),
  double clock-in (flag as anomaly), shifts crossing midnight.

## 5. Data model

**`employees`**: id, auth_user_id, full_name, email (unique), role (`employee`/`admin`),
active, created_at.

**`punches`**: id, employee_id, punch_type (`in`/`out`), server_time (DB `now()`),
photo_path, latitude, longitude, accuracy_m, distance_m, out_of_range, device_info, created_at.

**`company_settings`** (single row): id=1, studio_name, studio_lat, studio_lng,
geofence_radius_m (150), block_out_of_range (false), require_photo (true), require_location (true).

**Derived `shifts`** — computed by pairing consecutive in/out punches per employee.

## 6. Security & data integrity (critical)

1. **Server-set timestamps.** `server_time` uses DB `now()`. Reject any client-supplied time.
2. **Row Level Security (RLS):** Employees INSERT/SELECT only their own punches; no
   UPDATE/DELETE. Admins SELECT all. No silent edits of punch photos/coords.
3. **Storage rules:** private photo bucket; employees upload but not overwrite; dashboard
   reads via signed URLs.
4. **Auth:** email + password via Supabase Auth. Admin role checked server-side.
5. **HTTPS only.**

## 7. Screens / routes

**Employee:** `/login`, `/` (clock).
**Admin:** `/admin`, `/admin/punch/[id]`, `/admin/payroll`, `/admin/settings`, `/admin/employees`.

## 8. Build plan

- Phase 0 — Setup (Next.js + Tailwind + PWA + Supabase schema/RLS/bucket)
- Phase 1 — Auth & roles
- Phase 2 — Employee clock flow (camera + GPS + server punch)
- Phase 3 — Admin dashboard (list, detail, CSV)
- Phase 4 — Geofence settings + payroll
- Phase 5 — Polish

## 9. Acceptance criteria

- Employee logs in on a phone, clocks in; record saved with photo, lat/long, **server** timestamp.
- Employee cannot edit or delete that record.
- Clock Out pairs with prior Clock In; hours computed correctly.
- Punch >150 m from studio flagged `out_of_range`, visible to admin.
- Admin filters punches by employee + date and exports CSV.
- Admin views each punch's photo and location on a map.
- Payroll view shows correct total hours per employee for a chosen week.
- Nothing works without HTTPS + granted camera/location (per settings).

## 10. Out of scope for MVP (later)

Face **recognition/matching** (MVP captures a photo for human review only), push
notifications, shift scheduling, payroll integration, multi-location, native apps, and an
offline queue of punches. Data model is designed so these can be added later.

## 11. Open questions for the human

1. Studio's exact address / GPS coordinate?
2. Confirm geofence radius (150 m default)?
3. Out-of-range punch: blocked or flagged? (Default: flagged.)
4. Payroll week start (Mon/Sun) and hours format (decimal vs HH:MM)?
5. Photo retention period and any privacy/consent notice before capture?
