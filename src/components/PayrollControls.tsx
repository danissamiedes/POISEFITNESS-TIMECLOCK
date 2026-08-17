"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  employees: { id: string; name: string }[];
  current: { employeeId: string; from: string; to: string };
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Start of the week containing `d`. weekStart: 1 = Monday, 0 = Sunday. */
function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0..6, Sun..Sat
  const diff = (day - weekStart + 7) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function PayrollControls({ employees, current }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(current.employeeId);
  const [from, setFrom] = useState(current.from);
  const [to, setTo] = useState(current.to);
  const [weekStart, setWeekStart] = useState<0 | 1>(1); // Monday default

  function push(f: string, t: string) {
    const params = new URLSearchParams();
    if (employeeId) params.set("employeeId", employeeId);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    router.push(`/admin/payroll?${params.toString()}`);
  }

  function apply() {
    push(from, to);
  }

  function thisWeek(offset = 0) {
    const now = new Date();
    const start = startOfWeek(now, weekStart);
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const f = iso(start);
    const t = iso(end);
    setFrom(f);
    setTo(t);
    push(f, t);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Employee
        </label>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Week starts
        </label>
        <select
          value={weekStart}
          onChange={(e) => setWeekStart(Number(e.target.value) as 0 | 1)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={1}>Monday</option>
          <option value={0}>Sunday</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={apply}
          className="rounded-lg bg-poise-accent px-4 py-2 text-sm font-medium text-white hover:bg-poise-accentHover"
        >
          Apply
        </button>
        <button
          onClick={() => thisWeek(0)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          This week
        </button>
        <button
          onClick={() => thisWeek(-1)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Last week
        </button>
      </div>
    </div>
  );
}
