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
  /** inclusive lower bound: a Manila calendar day (YYYY-MM-DD) or full ISO */
  from?: string;
  /** inclusive upper bound: a Manila calendar day (YYYY-MM-DD) or full ISO */
  to?: string;
}

// Date-only filter values are Manila calendar days. Anchor them to the start /
// end of that day in UTC+8 so a punch just after local midnight isn't clipped.
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
function fromBoundary(d: string): string {
  return DAY_ONLY.test(d) ? `${d}T00:00:00.000+08:00` : d;
}
function toBoundary(d: string): string {
  return DAY_ONLY.test(d) ? `${d}T23:59:59.999+08:00` : d;
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

export interface StorageUsage {
  bytes: number;
  files: number;
  buckets: { bucket_id: string; file_count: number; bytes: number }[];
}

/** Total storage used across buckets, via the storage_usage() RPC.
 *  Returns null if the function isn't installed yet (migration not run). */
export async function fetchStorageUsage(): Promise<StorageUsage | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("storage_usage");
    if (error) return null;
    const rows = (data ?? []) as {
      bucket_id: string;
      file_count: number | string;
      bytes: number | string;
    }[];
    const buckets = rows.map((r) => ({
      bucket_id: r.bucket_id,
      file_count: Number(r.file_count) || 0,
      bytes: Number(r.bytes) || 0,
    }));
    return {
      bytes: buckets.reduce((s, b) => s + b.bytes, 0),
      files: buckets.reduce((s, b) => s + b.file_count, 0),
      buckets,
    };
  } catch {
    return null;
  }
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
  if (filter.from) query = query.gte("server_time", fromBoundary(filter.from));
  if (filter.to) query = query.lte("server_time", toBoundary(filter.to));

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
  if (filter.from) query = query.gte("server_time", fromBoundary(filter.from));
  if (filter.to) query = query.lte("server_time", toBoundary(filter.to));
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
