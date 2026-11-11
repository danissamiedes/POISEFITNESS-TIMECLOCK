import "server-only";

import { createAdminClient } from "./supabase/admin";

const BUCKET = process.env.NEXT_PUBLIC_PHOTO_BUCKET ?? "punch-photos";

/** Photos older than this are removed automatically. Default 90 days. */
export const RETENTION_DAYS = Number(process.env.PHOTO_RETENTION_DAYS) || 90;

export interface PurgeResult {
  deleted: number;
}

/**
 * Remove punch photos older than RETENTION_DAYS. The punch records themselves
 * (time, location, geofence flag) are KEPT for the audit trail — only the photo
 * image is deleted from storage and its photo_path cleared. Runs via the daily
 * cron and the manual "Purge now" button. Caps files per run to stay well under
 * the serverless time limit; the daily job clears any backlog over a few days.
 */
export async function purgeOldPhotos(maxFiles = 800): Promise<PurgeResult> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();

  const { data, error } = await admin
    .from("punches")
    .select("id, photo_path")
    .lt("server_time", cutoff)
    .not("photo_path", "is", null)
    .limit(maxFiles);
  if (error) throw error;

  const rows = (data ?? []) as { id: string; photo_path: string }[];
  if (rows.length === 0) return { deleted: 0 };

  const paths = rows.map((r) => r.photo_path);
  for (let i = 0; i < paths.length; i += 100) {
    const { error: rmErr } = await admin.storage
      .from(BUCKET)
      .remove(paths.slice(i, i + 100));
    if (rmErr) throw rmErr;
  }

  const ids = rows.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 200) {
    const { error: upErr } = await admin
      .from("punches")
      .update({ photo_path: null })
      .in("id", ids.slice(i, i + 200));
    if (upErr) throw upErr;
  }

  return { deleted: paths.length };
}
