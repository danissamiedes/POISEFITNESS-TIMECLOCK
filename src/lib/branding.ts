import "server-only";

import { cache } from "react";
import { createAdminClient } from "./supabase/admin";

/** Shown when no custom logo has been uploaded. */
export const FALLBACK_LOGO = "/brand/poise-logo.svg";

/**
 * The studio's current logo URL (uploaded via admin settings), or the bundled
 * placeholder. Read from company_settings so it works on the unauthenticated
 * login page too. Cached per request to avoid duplicate reads within a render.
 */
export const getBrandLogoUrl = cache(async (): Promise<string> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("company_settings")
      .select("logo_url")
      .eq("id", 1)
      .maybeSingle();
    const url = (data?.logo_url as string | null) ?? null;
    return url && url.trim() !== "" ? url : FALLBACK_LOGO;
  } catch {
    return FALLBACK_LOGO;
  }
});
