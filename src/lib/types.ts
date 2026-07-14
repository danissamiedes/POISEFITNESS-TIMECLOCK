export type Role = "employee" | "admin";
export type PunchType = "in" | "out";

export interface Employee {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Punch {
  id: string;
  employee_id: string;
  punch_type: PunchType;
  server_time: string;
  photo_path: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  distance_m: number | null;
  out_of_range: boolean;
  device_info: string | null;
  created_at: string;
}

export interface PunchWithEmployee extends Punch {
  employee: Pick<Employee, "id" | "full_name" | "email">;
}

export interface CompanySettings {
  id: number;
  studio_name: string;
  studio_lat: number | null;
  studio_lng: number | null;
  geofence_radius_m: number;
  block_out_of_range: boolean;
  require_photo: boolean;
  require_location: boolean;
  updated_at: string;
}

/** A paired shift derived from consecutive in/out punches. */
export interface Shift {
  employee_id: string;
  employee_name: string;
  clock_in: Punch;
  clock_out: Punch | null; // null => still in progress
  hours: number | null; // null while in progress
  crosses_midnight: boolean;
  anomaly: string | null; // e.g. "double clock-in"
}
