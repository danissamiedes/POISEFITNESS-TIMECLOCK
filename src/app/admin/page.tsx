import Link from "next/link";
import { fetchEmployees, fetchPunches, type PunchFilter } from "@/lib/admin-data";
import { formatMeters } from "@/lib/geo";
import { PunchFilters } from "@/components/PunchFilters";
import { ExportPunchesButton } from "@/components/ExportPunchesButton";

export const dynamic = "force-dynamic";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

export default async function AdminPunchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filter: PunchFilter = {
    employeeId: searchParams.employeeId || undefined,
    from: searchParams.from ? `${searchParams.from}T00:00:00.000Z` : undefined,
    to: searchParams.to ? `${searchParams.to}T23:59:59.999Z` : undefined,
  };

  const [employees, { punches, photoUrls }] = await Promise.all([
    fetchEmployees(),
    fetchPunches(filter),
  ]);

  const flagged = punches.filter((p) => p.out_of_range).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Punches</h1>
          <p className="text-sm text-gray-500">
            {punches.length} punch{punches.length === 1 ? "" : "es"}
            {flagged > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {flagged} flagged out of range
              </span>
            )}
          </p>
        </div>
        <ExportPunchesButton
          punches={punches.map((p) => ({
            name: p.employee?.full_name ?? "",
            type: p.punch_type,
            time: p.server_time,
            lat: p.latitude,
            lng: p.longitude,
            accuracy: p.accuracy_m,
            distance: p.distance_m,
            outOfRange: p.out_of_range,
          }))}
        />
      </div>

      <PunchFilters
        employees={employees.map((e) => ({ id: e.id, name: e.full_name }))}
        current={{
          employeeId: searchParams.employeeId ?? "",
          from: searchParams.from ?? "",
          to: searchParams.to ?? "",
        }}
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Server time</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {punches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No punches match these filters.
                </td>
              </tr>
            )}
            {punches.map((p) => {
              const url = p.photo_path ? photoUrls[p.photo_path] : undefined;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {p.employee?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.punch_type === "in"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.punch_type === "in" ? "Clock In" : "Clock Out"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(p.server_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {p.latitude != null && p.longitude != null ? (
                      <span className="font-mono text-xs">
                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {p.out_of_range ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ⚠ {formatMeters(p.distance_m)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {formatMeters(p.distance_m)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/punch/${p.id}`}
                      className="text-xs font-medium text-poise-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
