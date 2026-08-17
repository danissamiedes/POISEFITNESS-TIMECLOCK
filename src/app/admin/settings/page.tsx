import { fetchSettings } from "@/lib/admin-data";
import { SettingsForm } from "@/components/SettingsForm";
import { LogoUploadForm } from "@/components/LogoUploadForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await fetchSettings();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Studio settings</h1>
        <p className="text-sm text-gray-500">
          Set your logo, the studio location, and the geofence. Punches beyond
          the radius are flagged (or blocked, if enabled).
        </p>
      </div>
      <LogoUploadForm currentLogo={settings.logo_url} />
      <SettingsForm settings={settings} />
    </div>
  );
}
