"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker, Circle } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ACCENT } from "@/lib/brand";

interface Props {
  lat: number | null;
  lng: number | null;
  radiusM: number;
  onPick: (lat: number, lng: number) => void;
}

/** Click-to-place studio location with a live geofence circle. */
export function MapPicker({ lat, lng, radiusM, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Init once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] =
        lat != null && lng != null ? [lat, lng] : [40.4168, -3.7038];
      const map = L.map(containerRef.current).setView(center, lat != null ? 16 : 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect lat/lng/radius changes.
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map || lat == null || lng == null) return;

      if (!markerRef.current) {
        markerRef.current = L.circleMarker([lat, lng], {
          radius: 7,
          color: ACCENT,
          fillColor: ACCENT,
          fillOpacity: 0.9,
        }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      if (!circleRef.current) {
        circleRef.current = L.circle([lat, lng], {
          radius: radiusM,
          color: ACCENT,
          weight: 1,
          fillColor: ACCENT,
          fillOpacity: 0.08,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(radiusM);
      }
      map.setView([lat, lng]);
    })();
  }, [lat, lng, radiusM]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full rounded-xl"
      style={{ minHeight: "18rem" }}
    />
  );
}
