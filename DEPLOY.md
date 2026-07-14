# Deploy guide — POISE Time Clock (Supabase + Vercel)

A click-by-click runbook to take the app live. Two accounts, ~20–30 minutes.

**Your settings for this deploy**
- Geofence radius: **50 m**
- Out-of-range punches: **flagged** (not blocked)
- First admin: **dm@bookkeepingpoint.com**
- Studio location: set on the map in the app after deploy (Part C, step 2)

> 🔐 **Never paste secret keys into chat, tickets, or commits.** The Supabase
> `service_role` key and database password go **only** into Vercel's
> environment-variable settings. If one leaks, rotate it in Supabase immediately.

---

## Part A — Supabase (database, auth, storage)

### A1. Create the project
1. Go to https://supabase.com → **Sign in** (with GitHub is fine) → **New project**.
2. Organization: your org. **Name:** `poise-timeclock`. **Database password:** click
   *Generate* and save it in your password manager (you rarely need it again).
3. **Region:** pick the one closest to the studio. Click **Create new project** and
   wait ~2 minutes for it to provision.

### A2. Run the schema (4 files, in order)
1. Left sidebar → **SQL Editor** → **+ New snippet**.
2. Open `supabase/01_schema.sql` from the repo, copy all of it, paste, click **Run**.
   You should see “Success. No rows returned.”
3. Repeat for **`02_functions.sql`**, then **`03_policies.sql`**, then
   **`04_seed.sql`** — one at a time, in that order. `03_policies.sql` also creates
   the private **`punch-photos`** storage bucket.

### A3. Create the first admin login
1. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: `dm@bookkeepingpoint.com`. Password: choose one (you'll sign in with it).
   Tick **Auto Confirm User**. Click **Create user**.
3. Click the new user in the list and **copy the User UID** (a uuid).

### A4. Link that user to an admin employee row
1. Back in **SQL Editor** → new snippet. Paste this, replacing the UID:
   ```sql
   insert into public.employees (auth_user_id, full_name, email, role, active)
   values ('PASTE-ADMIN-AUTH-USER-UID', 'Studio Manager', 'dm@bookkeepingpoint.com', 'admin', true)
   on conflict (email) do update
     set auth_user_id = excluded.auth_user_id, role = 'admin', active = true;
   ```
2. **Run**. This is what makes the account an admin (checked server-side).

### A5. Copy the API keys (you'll paste these into Vercel next)
1. Left sidebar → **Project Settings** (gear) → **API**.
2. You need three values:
   - **Project URL** — e.g. `https://abcd1234.supabase.co`
   - **anon public** key (under *Project API keys*)
   - **service_role** key (same section — click reveal). **Secret.**
3. Keep this tab open, or paste the three into your password manager for a moment.

---

## Part B — Vercel (hosting)

### B1. Import the repo
1. Go to https://vercel.com → **Sign up / Log in with GitHub**.
2. **Add New… → Project** → find **POISEFITNESS-TIMECLOCK** → **Import**.
   (If Vercel can't see it, click *Adjust GitHub App Permissions* and grant access
   to the repo.)
3. Framework preset auto-detects **Next.js**. Leave build/output settings default.

### B2. Add environment variables
Before clicking Deploy, expand **Environment Variables** and add these four
(apply to Production, Preview, and Development):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from A5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the **anon public** key from A5 |
| `SUPABASE_SERVICE_ROLE_KEY` | the **service_role** key from A5 (secret) |
| `NEXT_PUBLIC_PHOTO_BUCKET` | `punch-photos` |

### B3. Deploy
1. Click **Deploy**. First build takes ~1–2 minutes.
2. When it finishes, note your URL, e.g. `https://poisefitness-timeclock.vercel.app`.
   (You can add a custom domain later under Project → Settings → Domains.)

### B4. Point Supabase auth at your live URL
1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** your Vercel URL from B3. Add it to **Redirect URLs** too. **Save.**

---

## Part C — First run

1. Open your Vercel URL on a phone (or laptop) and sign in with
   `dm@bookkeepingpoint.com` and the password from A3. You land on the clock; the
   **Admin** button appears because the account is an admin.
2. Go to **/admin/settings** → click your studio on the map (or type the
   coordinates) → confirm radius is **50 m** → **Save settings**. This is what turns
   on geofencing; until it's set, punches simply aren't distance-checked.
3. Go to **/admin/employees** → add your team. Each gets an email + temporary
   password you share with them privately.
4. Have someone clock in: allow **camera** and **location** when prompted (the app
   requires HTTPS for both — Vercel provides it automatically).

---

## Part D — Confirm it works (acceptance check)

- [ ] An employee can sign in on a phone, clock in, and it saves with a photo,
      lat/long, and a **server** timestamp.
- [ ] That employee cannot edit or delete the record (they only see their own).
- [ ] Clock Out pairs with the prior Clock In; hours compute in **Payroll**.
- [ ] A punch >50 m from the studio shows **flagged / out of range** in **/admin**.
- [ ] Admin can filter punches by employee + date and **Export CSV**.
- [ ] Admin can open a punch and see the **photo + map**.

---

## Troubleshooting

- **Vercel build fails on env vars** → a variable is missing/misnamed; re-check the
  four names in B2 exactly, then **Redeploy**.
- **Can't sign in / “No employee record”** → A4 didn't run or the UID was wrong.
  Re-run A4 with the correct User UID from A3.
- **Camera or location won't start** → must be HTTPS (Vercel is) and permissions must
  be allowed in the browser; on iOS use Safari. Localhost also counts as secure.
- **Photos don't show in the dashboard** → confirm `03_policies.sql` ran (it creates
  the `punch-photos` bucket) and `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel.
- **Nothing is ever flagged out of range** → set the studio location in
  **/admin/settings** (Part C, step 2).

When you're set up, tell me the Vercel URL and I'll help you run through Part D.
