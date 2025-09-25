"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-leaflet to avoid SSR issues
// Use 'as any' for dynamic imports to avoid type errors with Next.js and react-leaflet
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Lightweight Leaflet CSS injection (avoids global import in layout)
function useLeafletCss() {
  useEffect(() => {
    const id = "leaflet-css-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    return () => {
      // keep CSS for subsequent renders; no cleanup
    };
  }, []);
}

interface MapPreviewProps {
  coordinates?: { lat: number; lon: number } | null;
  isLoading?: boolean;
}

export default function MapPreview({
  coordinates,
  isLoading,
}: MapPreviewProps) {
  useLeafletCss();

  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (coordinates) {
      setCenter([coordinates.lat, coordinates.lon]);
    }
  }, [coordinates]);

  // Only render map once we have real coordinates to avoid misleading fallback
  const effectiveCenter = center;
  const mapKey = effectiveCenter
    ? `${effectiveCenter[0]},${effectiveCenter[1]}`
    : "placeholder";

  return (
    <div className="relative w-full h-56 rounded-lg overflow-hidden border border-border bg-muted/20">
      {/* Guard for SSR: MapContainer renders only on client via dynamic import */}
      {effectiveCenter ? (
        <MapContainer
          key={mapKey}
          center={effectiveCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={effectiveCenter} />
        </MapContainer>
      ) : (
        <div className="w-full h-full animate-pulse bg-muted" />
      )}
      {isLoading && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-md bg-background/80 border border-border text-muted-foreground">
            Locating…
          </div>
        </div>
      )}
    </div>
  );
}
