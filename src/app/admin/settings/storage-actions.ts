"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { purgeOldPhotos } from "@/lib/photo-retention";

export interface PurgeActionResult {
  ok: boolean;
  deleted?: number;
  error?: string;
}

/** Admin-triggered "Purge now" for old punch photos. */
export async function purgeOldPhotosAction(): Promise<PurgeActionResult> {
  await requireAdmin();
  try {
    const { deleted } = await purgeOldPhotos();
    revalidatePath("/admin/settings");
    return { ok: true, deleted };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Purge failed" };
  }
}
