"use client";

import { useState, useTransition } from "react";
import { purgeOldPhotosAction } from "@/app/admin/settings/storage-actions";

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

interface Props {
  bytes: number;
  files: number;
  limitBytes: number;
  retentionDays: number;
  available: boolean;
}

export function StorageUsageCard({ bytes, files, limitBytes, retentionDays, available }: Props) {
  const [purging, startPurge] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const pct = limitBytes > 0 ? Math.min(100, (bytes / limitBytes) * 100) : 0;
  const barColor = pct < 70 ? "bg-green-500" : pct < 90 ? "bg-amber-500" : "bg-red-500";

  function purgeNow() {
    setResult(null);
    startPurge(async () => {
      const res = await purgeOldPhotosAction();
      setResult(
        res.ok
          ? {
              ok: true,
              msg:
                res.deleted && res.deleted > 0
                  ? `Removed ${res.deleted} old photo${res.deleted === 1 ? "" : "s"}.`
                  : "No photos were old enough to remove.",
            }
          : { ok: false, msg: res.error ?? "Purge failed" }
      );
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-700">Storage</h2>

      {available ? (
        <>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm text-gray-900">
              <span className="font-semibold">{fmt(bytes)}</span> of {fmt(limitBytes)} used
            </span>
            <span
              className={`text-sm font-semibold ${
                pct < 70 ? "text-green-600" : pct < 90 ? "text-amber-600" : "text-red-600"
              }`}
            >
              {pct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {files.toLocaleString()} file{files === 1 ? "" : "s"} stored (punch photos + logo).
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Storage usage isn&apos;t available yet. Run <code>supabase/08_storage_usage.sql</code> in
          the Supabase SQL Editor to enable it.
        </p>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500">
          Photos older than <strong>{retentionDays} days</strong> are removed automatically each
          day. Punch records (time, location, flags) are always kept — only the photo image is
          deleted.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={purgeNow}
            disabled={purging}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {purging ? "Purging…" : "Purge old photos now"}
          </button>
          {result && (
            <span className={`text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>
              {result.msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
