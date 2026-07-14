"use client";

import { useState, useTransition } from "react";
import {
  setEmployeeActive,
  setEmployeeRole,
  updateEmployeeDetails,
} from "@/app/admin/employees/actions";
import type { Employee, Role } from "@/lib/types";

export function EmployeeRow({ employee }: { employee: Employee }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(employee.role);
  const [active, setActive] = useState(employee.active);
  const [open, setOpen] = useState(false);

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
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-2 text-left font-medium text-gray-900"
          >
            <span
              className={`inline-block text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              ▶
            </span>
            {employee.full_name}
          </button>
        </td>
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
      {open && (
        <tr className="bg-gray-50/60">
          <td colSpan={5} className="px-4 pb-5 pt-1">
            <DetailsForm employee={employee} />
          </td>
        </tr>
      )}
    </>
  );
}

function DetailsForm({ employee }: { employee: Employee }) {
  const [saving, startSave] = useTransition();
  const [address, setAddress] = useState(employee.address ?? "");
  const [dateHired, setDateHired] = useState(employee.date_hired ?? "");
  const [payRate, setPayRate] = useState(
    employee.pay_rate != null ? String(employee.pay_rate) : ""
  );
  const [notes, setNotes] = useState(employee.notes ?? "");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  function save() {
    setStatus(null);
    startSave(async () => {
      const res = await updateEmployeeDetails(employee.id, {
        address,
        date_hired: dateHired,
        pay_rate: payRate.trim() === "" ? null : Number(payRate),
        notes,
      });
      setStatus({ ok: res.ok, msg: res.ok ? "Saved." : res.error ?? "Failed" });
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Date hired</label>
          <input
            type="date"
            value={dateHired}
            onChange={(e) => setDateHired(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Pay rate (per hour)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={payRate}
            onChange={(e) => setPayRate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-poise-accent px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save details"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-green-700" : "text-red-600"}`}>
            {status.msg}
          </span>
        )}
      </div>
    </div>
  );
}
