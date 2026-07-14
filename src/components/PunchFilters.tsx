"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  employees: { id: string; name: string }[];
  current: { employeeId: string; from: string; to: string };
}

export function PunchFilters({ employees, current }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(current.employeeId);
  const [from, setFrom] = useState(current.from);
  const [to, setTo] = useState(current.to);

  function apply() {
    const params = new URLSearchParams();
    if (employeeId) params.set("employeeId", employeeId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/admin?${params.toString()}`);
  }

  function reset() {
    setEmployeeId("");
    setFrom("");
    setTo("");
    router.push("/admin");
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
      <div className="flex gap-2">
        <button
          onClick={apply}
          className="rounded-lg bg-poise-accent px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
        >
          Apply
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
