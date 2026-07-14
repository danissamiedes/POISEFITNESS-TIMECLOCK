"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haversineMeters, formatMeters } from "@/lib/geo";
import type { CompanySettings, Punch, PunchType } from "@/lib/types";

const PHOTO_BUCKET = process.env.NEXT_PUBLIC_PHOTO_BUCKET ?? "punch-photos";

type Coords = { lat: number; lng: number; accuracy: number };

interface Props {
  employeeId: string;
  nextAction: PunchType;
  lastPunch: Punch | null;
  settings: CompanySettings;
}

export function ClockCard({ employeeId, nextAction, lastPunch, settings }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: PunchType; time: string; outOfRange: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const secureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

  // --- Camera -------------------------------------------------------------
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch {
      setCameraReady(false);
      setCameraError(
        "Camera access is required. Please allow the camera and reload."
      );
    }
  }, []);

  useEffect(() => {
    if (!secureContext) return;
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [secureContext, startCamera]);

  // --- Location -----------------------------------------------------------
  const requestLocation = useCallback(() => {
    setLocError(null);
    setLocating(true);
    if (!("geolocation" in navigator)) {
      setLocating(false);
      setLocError("This device does not support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is required. Please allow location and try again."
            : "Could not read your location. Move to an open area and retry."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (secureContext) requestLocation();
  }, [secureContext, requestLocation]);

  // --- Preview distance (advisory only; server recomputes) ----------------
  const previewDistance =
    coords && settings.studio_lat != null && settings.studio_lng != null
      ? haversineMeters(settings.studio_lat, settings.studio_lng, coords.lat, coords.lng)
      : null;
  const previewOutOfRange =
    previewDistance != null && previewDistance > settings.geofence_radius_m;

  function capturePhoto(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !cameraReady) return resolve(null);
      const size = Math.min(video.videoWidth, video.videoHeight) || 480;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      // center-crop square
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });
  }

  async function submitPunch() {
    setError(null);

    if (settings.require_photo && !cameraReady) {
      setError("A photo is required. Enable the camera and try again.");
      return;
    }
    if (settings.require_location && !coords) {
      setError("Location is required. Enable location and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // 1) Upload photo (write-once path under the employee's folder).
      let photoPath: string | null = null;
      if (cameraReady) {
        const blob = await capturePhoto();
        if (!blob && settings.require_photo) {
          throw new Error("Could not capture a photo. Try again.");
        }
        if (blob) {
          const filename = `${employeeId}/${crypto.randomUUID()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(filename, blob, {
              contentType: "image/jpeg",
              upsert: false, // write-once: never overwrite
            });
          if (upErr) throw upErr;
          photoPath = filename;
        }
      }

      // 2) Record the punch via the server-authoritative RPC. The DB sets the
      //    timestamp, derives in/out, and computes the geofence flag.
      const { data, error: rpcErr } = await supabase.rpc("create_punch", {
        p_photo_path: photoPath,
        p_latitude: coords?.lat ?? null,
        p_longitude: coords?.lng ?? null,
        p_accuracy_m: coords?.accuracy ?? null,
        p_device_info:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
      });

      if (rpcErr) throw rpcErr;
      const punch = data as Punch;
      setResult({
        type: punch.punch_type,
        time: punch.server_time,
        outOfRange: punch.out_of_range,
      });
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Secure context gate ------------------------------------------------
  if (!secureContext) {
    return (
      <Card>
        <p className="text-center text-sm text-red-700">
          This app must be served over HTTPS to use the camera and location.
          Open it via its secure URL.
        </p>
      </Card>
    );
  }

  // --- Confirmation -------------------------------------------------------
  if (result) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            You&apos;re clocked {result.type === "in" ? "in" : "out"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(result.time).toLocaleString()}
          </p>
          {result.outOfRange && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠ This punch was outside the studio geofence and has been flagged
              for your manager.
            </p>
          )}
          <button
            onClick={() => {
              setResult(null);
              router.refresh();
            }}
            className="mt-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Done
          </button>
        </div>
      </Card>
    );
  }

  // --- Main punch UI ------------------------------------------------------
  const canSubmit =
    (!settings.require_photo || cameraReady) &&
    (!settings.require_location || !!coords) &&
    !submitting;

  return (
    <Card>
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-300">
            {cameraError ?? "Starting camera…"}
          </div>
        )}
      </div>

      {/* Location status */}
      <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm">
        {coords ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-700">
              📍 Location ready
              <span className="ml-1 text-xs text-gray-400">
                (±{Math.round(coords.accuracy)} m)
              </span>
            </span>
            {previewDistance != null && (
              <span
                className={
                  previewOutOfRange ? "text-xs text-amber-600" : "text-xs text-green-600"
                }
              >
                {formatMeters(previewDistance)} from studio
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">
              {locating ? "Reading location…" : locError ?? "Location not set"}
            </span>
            <button
              onClick={requestLocation}
              className="text-xs font-medium text-poise-accent hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{cameraError}</span>
          <button onClick={startCamera} className="text-xs font-medium underline">
            Retry
          </button>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={submitPunch}
        disabled={!canSubmit}
        className={`w-full rounded-xl py-4 text-lg font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          nextAction === "in"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {submitting
          ? "Submitting…"
          : nextAction === "in"
            ? "Clock In"
            : "Clock Out"}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        {settings.require_photo && settings.require_location
          ? "A photo and your location are captured with each punch."
          : "Your punch is timestamped by the server."}
      </p>

      {lastPunch && (
        <p className="mt-4 text-center text-xs text-gray-500">
          Last punch: clocked {lastPunch.punch_type === "in" ? "in" : "out"} at{" "}
          {new Date(lastPunch.server_time).toLocaleString()}
        </p>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">{children}</div>
  );
}
