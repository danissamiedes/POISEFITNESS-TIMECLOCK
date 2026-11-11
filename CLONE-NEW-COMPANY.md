# Launch the app for another company

This one codebase is **white-labeled**: the same repo powers multiple companies,
each as its own independent deployment with its own database, employees, logo,
name, color, and URL. Nothing is shared between companies.

To stand up a new company you create **a new Supabase project** and **a new
Vercel project** (both pointing at this same GitHub repo) and give them their own
branding via environment variables. ~20 minutes.

> Example below uses **BOOKKEEPINGPOINT** with a professional **blue** theme.
> 🔐 As always, secret keys go only into Vercel's env settings, never into chat.

---

## Part A — New Supabase project
1. https://supabase.com → **New project** (e.g. `bookkeepingpoint-timeclock`).
   Save the DB password; pick the nearest region.
2. **SQL Editor** → run these files from the repo's `supabase/` folder, **in order**
   (skip `04_seed.sql` — that one is POISE-specific; `01_schema.sql` already
   creates the default settings row):
   - `01_schema.sql`
   - `02_functions.sql`
   - `03_policies.sql`
   - `05_employee_fields.sql`
   - `07_branding.sql`
3. **Authentication → Users → Add user** → the new company's admin email + a
   password, tick **Auto Confirm User**. Copy the **User UID**.
4. **SQL Editor** — link that user as admin **and set the company's display name**:
   ```sql
   insert into public.employees (auth_user_id, full_name, email, role, active)
   values ('PASTE-UID', 'Admin', 'admin@bookkeepingpoint.com', 'admin', true)
   on conflict (email) do update set auth_user_id = excluded.auth_user_id, role='admin', active=true;

   update public.company_settings set studio_name = 'BOOKKEEPINGPOINT' where id = 1;
   ```
5. **Project Settings → API Keys** → copy the **Project URL**, **anon** key, and
   **service_role** key.

## Part B — New Vercel project
1. https://vercel.com → **Add New… → Project** → import **the same repo**
   (`POISEFITNESS-TIMECLOCK`). Vercel allows importing one repo into multiple
   projects; name this one `bookkeepingpoint-timeclock`.
2. **Environment Variables** — add these (Production, Preview, Development):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the new project's URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the new anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the new service_role key |
   | `NEXT_PUBLIC_PHOTO_BUCKET` | `punch-photos` |
   | `NEXT_PUBLIC_APP_NAME` | `BOOKKEEPINGPOINT` |
   | `NEXT_PUBLIC_ACCENT` | `#2563eb` |
   | `NEXT_PUBLIC_ACCENT_HOVER` | `#1d4ed8` |
   | `NEXT_PUBLIC_ACCENT_LIGHT` | `#eff6ff` |

   The four `NEXT_PUBLIC_ACCENT*` / `APP_NAME` vars are what make this instance
   blue and say "BOOKKEEPINGPOINT" instead of pink "POISE". Omit them and it
   falls back to the POISE pink defaults.
3. **Deploy.** Note the URL, e.g. `https://bookkeepingpoint-timeclock.vercel.app`.
4. Supabase → **Authentication → URL Configuration** → set **Site URL** (and add
   to Redirect URLs) to that Vercel URL.

## Part C — First run
1. Open the URL, sign in as the admin.
2. **Settings** → upload the company logo, set the studio location on the map,
   confirm the geofence radius.
3. **Employees** → add the team.

Done — a fully separate blue "BOOKKEEPINGPOINT" time clock, independent from POISE.

---

## Good to know
- **Both apps share this repo and deploy from `main`.** When I ship a fix or
  feature, redeploy each Vercel project to pick it up (Vercel usually auto-deploys
  both on a push to `main`).
- **Data is 100% separate** — different Supabase projects. No employee, punch, or
  photo is shared between companies.
- **To change a company's name/color later**, edit its Vercel env vars and redeploy
  that project only.
- The bundled PWA launcher icon (the small "clock" app icon) is still POISE-pink
  for now; the in-app logo, header, login, name, and theme color are all correct.
  Ask if you want per-company PWA icons too.
