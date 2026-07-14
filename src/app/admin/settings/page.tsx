import { fetchSettings } from "@/lib/admin-data";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await fetchSettings();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Studio settings</h1>
      <p className="mb-4 text-sm text-gray-500">
        Set the studio location and geofence. Punches beyond the radius are
        flagged (or blocked, if enabled).
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
