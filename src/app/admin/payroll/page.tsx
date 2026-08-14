import { fetchEmployees, fetchPunchesRaw, type PunchFilter } from "@/lib/admin-data";
import { pairShifts, summarizePayroll } from "@/lib/shifts";
import { formatDateTime } from "@/lib/datetime";
import { PayrollControls } from "@/components/PayrollControls";
import { ExportPayrollButton } from "@/components/ExportPayrollButton";

export const dynamic = "force-dynamic";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const employees = await fetchEmployees();

  const filter: PunchFilter = {
    employeeId: searchParams.employeeId || undefined,
    from: searchParams.from ? `${searchParams.from}T00:00:00.000Z` : undefined,
    to: searchParams.to ? `${searchParams.to}T23:59:59.999Z` : undefined,
  };

  const punches = await fetchPunchesRaw(filter);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const shifts = pairShifts(punches, nameById);
  const summary = summarizePayroll(shifts);

  const totalHours = summary.reduce((s, r) => s + r.total_hours, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500">
            Total {totalHours.toFixed(2)} h across {summary.length} employee
            {summary.length === 1 ? "" : "s"} for the selected period.
          </p>
        </div>
        <ExportPayrollButton
          rows={summary}
          period={{ from: searchParams.from ?? "", to: searchParams.to ?? "" }}
        />
      </div>

      <PayrollControls
        employees={employees.map((e) => ({ id: e.id, name: e.full_name }))}
        current={{
          employeeId: searchParams.employeeId ?? "",
          from: searchParams.from ?? "",
          to: searchParams.to ?? "",
        }}
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Total hours</th>
              <th className="px-4 py-3">Shifts</th>
              <th className="px-4 py-3">In progress</th>
              <th className="px-4 py-3">Anomalies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summary.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No completed shifts in this period.
                </td>
              </tr>
            )}
            {summary.map((r) => (
              <tr key={r.employee_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {r.employee_name}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {r.total_hours.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.shift_count}</td>
                <td className="px-4 py-3 text-gray-600">
                  {r.open_shifts > 0 ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {r.open_shifts} open
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.anomalies > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {r.anomalies}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ShiftBreakdown shifts={shifts} />
    </div>
  );
}

function ShiftBreakdown({
  shifts,
}: {
  shifts: ReturnType<typeof pairShifts>;
}) {
  if (shifts.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Shift detail
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Clock in</th>
              <th className="px-4 py-3">Clock out</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((s, i) => (
              <tr key={`${s.employee_id}-${i}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">
                  {s.employee_name}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {formatDateTime(s.clock_in.server_time)}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {s.clock_out ? formatDateTime(s.clock_out.server_time) : "—"}
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {s.hours != null ? s.hours.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {s.clock_out == null && s.anomaly == null && (
                      <Tag color="blue">in progress</Tag>
                    )}
                    {s.crosses_midnight && <Tag color="gray">crosses midnight</Tag>}
                    {s.anomaly && <Tag color="amber">{s.anomaly}</Tag>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "blue" | "gray" | "amber";
}) {
  const map = {
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[color]}`}>
      {children}
    </span>
  );
}
