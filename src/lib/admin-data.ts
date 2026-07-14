import "server-only";

import { createAdminClient } from "./supabase/admin";
import type {
  CompanySettings,
  Employee,
  Punch,
  PunchWithEmployee,
} from "./types";

const BUCKET = process.env.NEXT_PUBLIC_PHOTO_BUCKET ?? "punch-photos";

export interface PunchFilter {
  employeeId?: string;
  /** inclusive ISO datetime lower bound */
  from?: string;
  /** inclusive ISO datetime upper bound */
  to?: string;
}

/** All employees, ordered by name. Service-role read (admin pages only). */
export async function fetchEmployees(): Promise<Employee[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data as Employee[]) ?? [];
}

export async function fetchSettings(): Promise<CompanySettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as CompanySettings;
}

/** Filtered punches (newest first) plus signed photo thumbnail URLs. */
export async function fetchPunches(
  filter: PunchFilter
): Promise<{ punches: PunchWithEmployee[]; photoUrls: Record<string, string> }> {
  const admin = createAdminClient();

  let query = admin
    .from("punches")
    .select("*, employee:employees(id, full_name, email)")
    .order("server_time", { ascending: false })
    .limit(2000);

  if (filter.employeeId) query = query.eq("employee_id", filter.employeeId);
  if (filter.from) query = query.gte("server_time", filter.from);
  if (filter.to) query = query.lte("server_time", filter.to);

  const { data, error } = await query;
  if (error) throw error;
  const punches = (data as PunchWithEmployee[]) ?? [];

  const photoUrls = await signPhotoUrls(
    punches.map((p) => p.photo_path).filter((p): p is string => !!p)
  );

  return { punches, photoUrls };
}

/** A single punch with its employee and a signed photo URL. */
export async function fetchPunch(
  id: string
): Promise<{ punch: PunchWithEmployee; photoUrl: string | null } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("punches")
    .select("*, employee:employees(id, full_name, email)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const punch = data as PunchWithEmployee;

  let photoUrl: string | null = null;
  if (punch.photo_path) {
    const urls = await signPhotoUrls([punch.photo_path]);
    photoUrl = urls[punch.photo_path] ?? null;
  }
  return { punch, photoUrl };
}

/** Punches for payroll shift-pairing over a date window (all employees or one). */
export async function fetchPunchesRaw(filter: PunchFilter): Promise<Punch[]> {
  const admin = createAdminClient();
  let query = admin
    .from("punches")
    .select("*")
    .order("server_time", { ascending: true })
    .limit(5000);
  if (filter.employeeId) query = query.eq("employee_id", filter.employeeId);
  if (filter.from) query = query.gte("server_time", filter.from);
  if (filter.to) query = query.lte("server_time", filter.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Punch[]) ?? [];
}

async function signPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (paths.length === 0) return map;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60); // 1 hour
  if (error) return map;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
