"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LogoResult {
  ok: boolean;
  error?: string;
  url?: string;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function revalidateBrandingPaths() {
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/admin", "layout");
}

/** Upload a new studio logo (admin only) and point company_settings at it. */
export async function uploadLogo(
  _prev: LogoResult | null,
  formData: FormData
): Promise<LogoResult> {
  await requireAdmin();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return { ok: false, error: "Use a PNG, JPG, WEBP, GIF, or SVG image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 2 MB or smaller." };
  }

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Timestamped filename so the public URL changes on each upload (cache-bust).
  const path = `logo-${Date.now()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from("branding")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: pub } = admin.storage.from("branding").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error } = await admin
    .from("company_settings")
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  revalidateBrandingPaths();
  return { ok: true, url };
}

/** Revert to the bundled placeholder logo. */
export async function resetLogo(): Promise<LogoResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("company_settings")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidateBrandingPaths();
  return { ok: true };
}
