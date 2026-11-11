import { fetchSettings, fetchStorageUsage } from "@/lib/admin-data";
import { SettingsForm } from "@/components/SettingsForm";
import { LogoUploadForm } from "@/components/LogoUploadForm";
import { StorageUsageCard } from "@/components/StorageUsageCard";
import { RETENTION_DAYS } from "@/lib/photo-retention";

export const dynamic = "force-dynamic";

const STORAGE_LIMIT_MB = Number(process.env.NEXT_PUBLIC_STORAGE_LIMIT_MB) || 1024;

export default async function SettingsPage() {
  const [settings, usage] = await Promise.all([fetchSettings(), fetchStorageUsage()]);
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
      <StorageUsageCard
        bytes={usage?.bytes ?? 0}
        files={usage?.files ?? 0}
        limitBytes={STORAGE_LIMIT_MB * 1024 * 1024}
        retentionDays={RETENTION_DAYS}
        available={usage != null}
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
