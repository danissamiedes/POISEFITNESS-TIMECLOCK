"use client";

import { useState, useTransition } from "react";
import {
  setEmployeeActive,
  setEmployeeRole,
} from "@/app/admin/employees/actions";
import type { Employee, Role } from "@/lib/types";

export function EmployeeRow({ employee }: { employee: Employee }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(employee.role);
  const [active, setActive] = useState(employee.active);

  function changeRole(next: Role) {
    setError(null);
    setRole(next);
    startTransition(async () => {
      const res = await setEmployeeRole(employee.id, next);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        setRole(employee.role);
      }
    });
  }

  function toggleActive() {
    setError(null);
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const res = await setEmployeeActive(employee.id, next);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        setActive(!next);
      }
    });
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900">{employee.full_name}</td>
      <td className="px-4 py-3 text-gray-600">{employee.email}</td>
      <td className="px-4 py-3">
        <select
          value={role}
          disabled={pending}
          onChange={(e) => changeRole(e.target.value as Role)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      </td>
      <td className="px-4 py-3">
        {active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
            Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={toggleActive}
          disabled={pending}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {active ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
