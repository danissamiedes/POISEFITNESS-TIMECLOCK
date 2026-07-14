import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role Supabase client. Bypasses RLS — use ONLY in server code after
 *  you have independently verified the caller is an admin (see requireAdmin()).
 *  Never import this into a Client Component. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
