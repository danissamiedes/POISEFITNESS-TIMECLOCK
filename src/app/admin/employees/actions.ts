"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/** Creates an auth user (email confirmed) and a linked employee row. */
export async function createEmployee(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = (String(formData.get("role") ?? "employee") as Role) === "admin"
    ? "admin"
    : "employee";
  const details = readDetails(formData);

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };
  if (details.error) return { ok: false, error: details.error };

  const admin = createAdminClient();

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (authErr || !created.user) {
    return { ok: false, error: authErr?.message ?? "Could not create auth user." };
  }

  const { error: empErr } = await admin.from("employees").insert({
    auth_user_id: created.user.id,
    full_name: fullName,
    email,
    role,
    active: true,
    address: details.address,
    date_hired: details.date_hired,
    pay_rate: details.pay_rate,
    notes: details.notes,
  });

  if (empErr) {
    // Roll back the orphaned auth user so the admin can retry cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: empErr.message };
  }

  revalidatePath("/admin/employees");
  return { ok: true, message: `Created ${fullName}.` };
}

/** Toggle an employee active/inactive. Deactivated employees cannot punch. */
export async function setEmployeeActive(
  employeeId: string,
  active: boolean
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("employees")
    .update({ active })
    .eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/employees");
  return { ok: true };
}

/** Change an employee's role. */
export async function setEmployeeRole(
  employeeId: string,
  role: Role
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("employees")
    .update({ role: role === "admin" ? "admin" : "employee" })
    .eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/employees");
  return { ok: true };
}

export interface EmployeeDetails {
  address: string | null;
  date_hired: string | null;
  pay_rate: number | null;
  notes: string | null;
}

/** Update an existing employee's personal info (address, hire date, rate, notes). */
export async function updateEmployeeDetails(
  employeeId: string,
  details: EmployeeDetails
): Promise<ActionResult> {
  await requireAdmin();

  if (details.pay_rate != null && (!Number.isFinite(details.pay_rate) || details.pay_rate < 0)) {
    return { ok: false, error: "Pay rate must be a positive number." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("employees")
    .update({
      address: emptyToNull(details.address),
      date_hired: emptyToNull(details.date_hired),
      pay_rate: details.pay_rate,
      notes: emptyToNull(details.notes),
    })
    .eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/employees");
  return { ok: true, message: "Saved." };
}

/** Parse the optional personal-info fields from the create form. */
function readDetails(formData: FormData): EmployeeDetails & { error?: string } {
  const rawRate = String(formData.get("pay_rate") ?? "").trim();
  let pay_rate: number | null = null;
  if (rawRate !== "") {
    const n = Number(rawRate);
    if (!Number.isFinite(n) || n < 0) {
      return { address: null, date_hired: null, pay_rate: null, notes: null, error: "Pay rate must be a positive number." };
    }
    pay_rate = n;
  }
  return {
    address: emptyToNull(String(formData.get("address") ?? "")),
    date_hired: emptyToNull(String(formData.get("date_hired") ?? "")),
    pay_rate,
    notes: emptyToNull(String(formData.get("notes") ?? "")),
  };
}

function emptyToNull(v: string | null): string | null {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
}
