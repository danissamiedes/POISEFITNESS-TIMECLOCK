"use client";

import { toCsv, downloadCsv } from "@/lib/csv";
import type { PayrollRow } from "@/lib/shifts";

export function ExportPayrollButton({
  rows,
  period,
}: {
  rows: PayrollRow[];
  period: { from: string; to: string };
}) {
  function exportCsv() {
    const csv = toCsv(
      ["Employee", "Total hours", "Completed shifts", "Open shifts", "Anomalies", "Period from", "Period to"],
      rows.map((r) => [
        r.employee_name,
        r.total_hours.toFixed(2),
        r.shift_count,
        r.open_shifts,
        r.anomalies,
        period.from,
        period.to,
      ])
    );
    const suffix = period.from && period.to ? `${period.from}_${period.to}` : "all";
    downloadCsv(`poise-payroll-${suffix}.csv`, csv);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={rows.length === 0}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
