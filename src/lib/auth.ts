import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Employee } from "./types";

/** Returns the current employee row (via RLS-safe self-select), or null. */
export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as Employee) ?? null;
}

/** Redirects to /login if unauthenticated. Returns the employee otherwise. */
export async function requireEmployee(): Promise<Employee> {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");
  if (!employee.active) redirect("/login?error=inactive");
  return employee;
}

/** Redirects non-admins away. Returns the admin employee otherwise. Admin role
 *  is checked against the DB (server-side), not merely hidden in the UI. */
export async function requireAdmin(): Promise<Employee> {
  const employee = await requireEmployee();
  if (employee.role !== "admin") redirect("/");
  return employee;
}
