"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createEmployee, type ActionResult } from "@/app/admin/employees/actions";

export function NewEmployeeForm() {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    createEmployee,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Add employee</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Full name
          </label>
          <input
            name="full_name"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Temporary password
          </label>
          <input
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="min 8 characters"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Role</label>
          <select
            name="role"
            defaultValue="employee"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message} Share the temporary password with them privately.
        </p>
      )}

      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-poise-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create employee"}
    </button>
  );
}
