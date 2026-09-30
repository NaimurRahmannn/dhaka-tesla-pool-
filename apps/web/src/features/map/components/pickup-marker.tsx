"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import type { Coordinates, MapLocation } from "../types/map.types";

export type PickupMarkerProps = {
  position?: Coordinates | null;
  location?: MapLocation | null;
  label?: string;
};

export function PickupMarker({
  position,
  location,
  label = "Pickup Location",
}: PickupMarkerProps) {
  const coords = position || location?.coordinates;

  const icon = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    try {
      // Dynamic import / require of leaflet on client only
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require("leaflet");
      return L.divIcon({
        className: "pickup-div-marker",
        html: `
          <div style="background-color: #059669; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;">
            P
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    } catch {
      return undefined;
    }
  }, []);

  if (!coords) return null;

  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={icon}
      eventHandlers={{}}
    >
      <Popup>
        <div className="text-xs" data-testid="pickup-marker-popup">
          <p className="font-semibold text-emerald-800">{label}</p>
          <p className="text-slate-600 font-mono">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
