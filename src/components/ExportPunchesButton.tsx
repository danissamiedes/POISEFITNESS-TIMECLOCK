"use client";

import { toCsv, downloadCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/datetime";
import type { PunchType } from "@/lib/types";

interface Row {
  name: string;
  type: PunchType;
  time: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  distance: number | null;
  outOfRange: boolean;
}

export function ExportPunchesButton({ punches }: { punches: Row[] }) {
  function exportCsv() {
    const csv = toCsv(
      [
        "Employee",
        "Type",
        "Server time (ISO/UTC)",
        "Server time (PHT)",
        "Latitude",
        "Longitude",
        "Accuracy (m)",
        "Distance from studio (m)",
        "Out of range",
      ],
      punches.map((p) => [
        p.name,
        p.type === "in" ? "Clock In" : "Clock Out",
        p.time,
        formatDateTime(p.time),
        p.lat ?? "",
        p.lng ?? "",
        p.accuracy != null ? Math.round(p.accuracy) : "",
        p.distance != null ? Math.round(p.distance) : "",
        p.outOfRange ? "YES" : "no",
      ])
    );
    downloadCsv(`poise-punches-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={punches.length === 0}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
