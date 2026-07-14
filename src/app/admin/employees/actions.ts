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

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

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
