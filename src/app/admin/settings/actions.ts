"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

export async function updateSettings(
  _prev: SettingsResult | null,
  formData: FormData
): Promise<SettingsResult> {
  await requireAdmin();

  const studioName = String(formData.get("studio_name") ?? "").trim();
  const lat = parseNum(formData.get("studio_lat"));
  const lng = parseNum(formData.get("studio_lng"));
  const radius = parseNum(formData.get("geofence_radius_m"));

  if (!studioName) return { ok: false, error: "Studio name is required." };
  if (lat == null || lng == null)
    return { ok: false, error: "Studio latitude and longitude are required." };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return { ok: false, error: "Coordinates are out of range." };
  if (radius == null || radius <= 0)
    return { ok: false, error: "Geofence radius must be a positive number." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("company_settings")
    .update({
      studio_name: studioName,
      studio_lat: lat,
      studio_lng: lng,
      geofence_radius_m: Math.round(radius),
      block_out_of_range: formData.get("block_out_of_range") === "on",
      require_photo: formData.get("require_photo") === "on",
      require_location: formData.get("require_location") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}

function parseNum(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
