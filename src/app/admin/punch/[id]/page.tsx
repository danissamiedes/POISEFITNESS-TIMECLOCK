import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPunch, fetchSettings } from "@/lib/admin-data";
import { formatMeters } from "@/lib/geo";
import { formatDateTime } from "@/lib/datetime";
import { MapView } from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function PunchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [result, settings] = await Promise.all([
    fetchPunch(params.id),
    fetchSettings(),
  ]);
  if (!result) notFound();
  const { punch, photoUrl } = result;

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-block text-sm text-poise-accent hover:underline"
      >
        ← Back to punches
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Photo
          </h2>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Punch"
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
              No photo captured
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Details
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Employee" value={punch.employee?.full_name ?? "—"} />
            <Row
              label="Type"
              value={punch.punch_type === "in" ? "Clock In" : "Clock Out"}
            />
            <Row
              label="Server time (PHT)"
              value={formatDateTime(punch.server_time)}
            />
            <Row
              label="Coordinates"
              value={
                punch.latitude != null && punch.longitude != null
                  ? `${punch.latitude.toFixed(6)}, ${punch.longitude.toFixed(6)}`
                  : "—"
              }
            />
            <Row
              label="GPS accuracy"
              value={punch.accuracy_m != null ? `±${Math.round(punch.accuracy_m)} m` : "—"}
            />
            <Row label="Distance from studio" value={formatMeters(punch.distance_m)} />
            <Row
              label="Geofence"
              value={
                punch.out_of_range ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    ⚠ Out of range
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    In range
                  </span>
                )
              }
            />
            {punch.device_info && (
              <Row
                label="Device"
                value={<span className="break-all text-xs text-gray-500">{punch.device_info}</span>}
              />
            )}
          </dl>
        </div>

        {punch.latitude != null && punch.longitude != null && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Location
            </h2>
            <MapView
              lat={punch.latitude}
              lng={punch.longitude}
              studioLat={settings.studio_lat}
              studioLng={settings.studio_lng}
              radiusM={settings.geofence_radius_m}
              outOfRange={punch.out_of_range}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
