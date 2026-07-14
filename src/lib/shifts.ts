import type { Punch, Shift } from "./types";

/**
 * Pair consecutive in/out punches per employee into shifts.
 *
 * Rules (SPEC §4.4):
 *   - Each `in` pairs with the NEXT `out` for that employee (time-ordered).
 *   - A trailing `in` with no following `out` is an open shift (in progress,
 *     not counted).
 *   - Two `in` punches in a row => the first shift is closed with a
 *     "double clock-in" anomaly and no clock_out; the second `in` starts fresh.
 *   - An `out` with no preceding open `in` is an orphan and is skipped
 *     (recorded as an anomaly on a zero-length placeholder).
 *   - Shifts crossing midnight are handled naturally because hours are computed
 *     from the two timestamps regardless of calendar day.
 *
 * @param punches  all punches for the employees of interest (any order)
 * @param nameById map employee_id -> display name
 */
export function pairShifts(
  punches: Punch[],
  nameById: Map<string, string>
): Shift[] {
  const byEmployee = new Map<string, Punch[]>();
  for (const p of punches) {
    const list = byEmployee.get(p.employee_id) ?? [];
    list.push(p);
    byEmployee.set(p.employee_id, list);
  }

  const shifts: Shift[] = [];

  for (const [employeeId, list] of byEmployee) {
    const name = nameById.get(employeeId) ?? "Unknown";
    const ordered = [...list].sort(
      (a, b) =>
        new Date(a.server_time).getTime() - new Date(b.server_time).getTime()
    );

    let openIn: Punch | null = null;

    for (const p of ordered) {
      if (p.punch_type === "in") {
        if (openIn) {
          // Two ins in a row: close the previous as an anomaly.
          shifts.push(makeShift(employeeId, name, openIn, null, "double clock-in"));
        }
        openIn = p;
      } else {
        // punch_type === "out"
        if (openIn) {
          shifts.push(makeShift(employeeId, name, openIn, p, null));
          openIn = null;
        } else {
          // Orphan clock-out with no matching in.
          shifts.push(makeShift(employeeId, name, p, p, "orphan clock-out"));
        }
      }
    }

    if (openIn) {
      // Still clocked in.
      shifts.push(makeShift(employeeId, name, openIn, null, null));
    }
  }

  // Newest first.
  return shifts.sort(
    (a, b) =>
      new Date(b.clock_in.server_time).getTime() -
      new Date(a.clock_in.server_time).getTime()
  );
}

function makeShift(
  employeeId: string,
  name: string,
  clockIn: Punch,
  clockOut: Punch | null,
  anomaly: string | null
): Shift {
  let hours: number | null = null;
  let crossesMidnight = false;

  if (clockOut && anomaly !== "orphan clock-out") {
    const inMs = new Date(clockIn.server_time).getTime();
    const outMs = new Date(clockOut.server_time).getTime();
    hours = Math.max(0, (outMs - inMs) / 3_600_000);
    crossesMidnight =
      new Date(clockIn.server_time).toDateString() !==
      new Date(clockOut.server_time).toDateString();
  }

  return {
    employee_id: employeeId,
    employee_name: name,
    clock_in: clockIn,
    clock_out: anomaly === "orphan clock-out" ? null : clockOut,
    hours: anomaly === "orphan clock-out" ? null : hours,
    crosses_midnight: crossesMidnight,
    anomaly,
  };
}

export interface PayrollRow {
  employee_id: string;
  employee_name: string;
  total_hours: number;
  shift_count: number;
  open_shifts: number;
  anomalies: number;
}

/** Aggregate paired shifts into per-employee totals for a payroll period. */
export function summarizePayroll(shifts: Shift[]): PayrollRow[] {
  const rows = new Map<string, PayrollRow>();

  for (const s of shifts) {
    const row =
      rows.get(s.employee_id) ??
      ({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        total_hours: 0,
        shift_count: 0,
        open_shifts: 0,
        anomalies: 0,
      } satisfies PayrollRow);

    if (s.hours != null) {
      row.total_hours += s.hours;
      row.shift_count += 1;
    }
    if (s.clock_out == null && s.anomaly == null) row.open_shifts += 1;
    if (s.anomaly) row.anomalies += 1;

    rows.set(s.employee_id, row);
  }

  return [...rows.values()]
    .map((r) => ({ ...r, total_hours: round2(r.total_hours) }))
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
