"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import { updateSettings, type SettingsResult } from "@/app/admin/settings/actions";
import type { CompanySettings } from "@/lib/types";

const MapPicker = dynamic(
  () => import("@/components/MapPicker").then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-72 w-full rounded-xl bg-gray-100" /> }
);

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, formAction] = useFormState<SettingsResult | null, FormData>(
    updateSettings,
    null
  );
  const [lat, setLat] = useState<number | null>(settings.studio_lat);
  const [lng, setLng] = useState<number | null>(settings.studio_lng);
  const [radius, setRadius] = useState<number>(settings.geofence_radius_m);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Studio name
        </label>
        <input
          name="studio_name"
          defaultValue={settings.studio_name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Studio location & geofence
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          Click the map to place the studio, or type coordinates directly.
        </p>
        <MapPicker
          lat={lat}
          lng={lng}
          radiusM={radius}
          onPick={(la, ln) => {
            setLat(Number(la.toFixed(6)));
            setLng(Number(ln.toFixed(6)));
          }}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Latitude
            </label>
            <input
              name="studio_lat"
              type="number"
              step="any"
              value={lat ?? ""}
              onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Longitude
            </label>
            <input
              name="studio_lng"
              type="number"
              step="any"
              value={lng ?? ""}
              onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Radius (meters)
            </label>
            <input
              name="geofence_radius_m"
              type="number"
              min={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700">Enforcement</h2>
        <Toggle
          name="require_photo"
          label="Require a photo on every punch"
          defaultChecked={settings.require_photo}
        />
        <Toggle
          name="require_location"
          label="Require location on every punch"
          defaultChecked={settings.require_location}
        />
        <Toggle
          name="block_out_of_range"
          label="Block out-of-range punches (otherwise flag only)"
          defaultChecked={settings.block_out_of_range}
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Settings saved.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-gray-300 text-poise-accent focus:ring-poise-accent"
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-poise-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}
