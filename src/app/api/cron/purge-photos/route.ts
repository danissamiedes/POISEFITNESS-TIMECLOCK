import { NextResponse } from "next/server";
import { purgeOldPhotos } from "@/lib/photo-retention";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily photo-retention purge, triggered by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET: Vercel automatically sends
 *   Authorization: Bearer <CRON_SECRET>
 * on cron invocations when that env var is set. Without the secret, or with a
 * wrong one, the route refuses — so it can't be triggered by the public.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await purgeOldPhotos();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "purge failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
