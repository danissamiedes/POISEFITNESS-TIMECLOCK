import { fetchEmployees } from "@/lib/admin-data";
import { NewEmployeeForm } from "@/components/NewEmployeeForm";
import { EmployeeRow } from "@/components/EmployeeRow";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await fetchEmployees();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Employees</h1>
      <p className="mb-4 text-sm text-gray-500">
        Add team members, set their role, and deactivate people who leave.
        There is no public sign-up.
      </p>

      <NewEmployeeForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No employees yet.
                </td>
              </tr>
            )}
            {employees.map((e) => (
              <EmployeeRow key={e.id} employee={e} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
