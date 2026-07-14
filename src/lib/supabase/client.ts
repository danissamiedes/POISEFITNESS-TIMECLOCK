"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components (browser). Uses the anon key
 *  and the logged-in user's session; all access is constrained by RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
