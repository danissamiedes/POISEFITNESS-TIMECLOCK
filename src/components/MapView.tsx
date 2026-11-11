"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ACCENT } from "@/lib/brand";

interface Props {
  lat: number;
  lng: number;
  /** optional studio location + radius to draw the geofence */
  studioLat?: number | null;
  studioLng?: number | null;
  radiusM?: number | null;
  outOfRange?: boolean;
  className?: string;
}

/** Read-only Leaflet map with OSM tiles. No API key required. Uses
 *  circleMarkers to avoid Leaflet's default marker-image bundling issues. */
export function MapView({
  lat,
  lng,
  studioLat,
  studioLng,
  radiusM,
  outOfRange,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const punchColor = outOfRange ? "#dc2626" : "#16a34a";
      const punch = L.circleMarker([lat, lng], {
        radius: 9,
        color: punchColor,
        fillColor: punchColor,
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      punch.bindPopup("Punch location");

      const bounds = L.latLngBounds([[lat, lng]]);

      if (studioLat != null && studioLng != null) {
        L.circleMarker([studioLat, studioLng], {
          radius: 7,
          color: ACCENT,
          fillColor: ACCENT,
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map)
          .bindPopup("Studio");

        if (radiusM && radiusM > 0) {
          const circle = L.circle([studioLat, studioLng], {
            radius: radiusM,
            color: ACCENT,
            weight: 1,
            fillColor: ACCENT,
            fillOpacity: 0.08,
          }).addTo(map);
          bounds.extend(circle.getBounds());
        }
        bounds.extend([studioLat, studioLng]);
      }

      map.fitBounds(bounds.pad(0.4), { maxZoom: 17 });
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setView([lat, lng], 16);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, studioLat, studioLng, radiusM, outOfRange]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-64 w-full rounded-xl"}
      style={{ minHeight: "16rem" }}
    />
  );
}
