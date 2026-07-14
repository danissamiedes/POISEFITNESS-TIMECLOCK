import { requireEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClockCard } from "@/components/ClockCard";
import { SignOutButton } from "@/components/SignOutButton";
import Link from "next/link";
import type { CompanySettings, Punch } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClockPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const [{ data: lastPunch }, { data: settings }] = await Promise.all([
    supabase
      .from("punches")
      .select("*")
      .eq("employee_id", employee.id)
      .order("server_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("company_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const nextAction =
    !lastPunch || (lastPunch as Punch).punch_type === "out" ? "in" : "out";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-10 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {(settings as CompanySettings | null)?.studio_name ??
              "POISE Fitness Studio"}
          </p>
          <h1 className="text-lg font-semibold text-gray-900">
            {employee.full_name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {employee.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <ClockCard
        employeeId={employee.id}
        nextAction={nextAction}
        lastPunch={(lastPunch as Punch) ?? null}
        settings={
          (settings as CompanySettings) ?? {
            id: 1,
            studio_name: "POISE Fitness Studio",
            studio_lat: null,
            studio_lng: null,
            geofence_radius_m: 150,
            block_out_of_range: false,
            require_photo: true,
            require_location: true,
            updated_at: new Date().toISOString(),
          }
        }
      />
    </main>
  );
}
