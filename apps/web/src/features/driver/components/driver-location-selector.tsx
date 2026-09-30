"use client";

import { useEffect, useState } from "react";
import {
  DHAKA_AREAS,
  DHAKA_HUBS,
  type DhakaHub,
} from "@/features/passenger/utils/format-location";

const STORAGE_KEY = "dhaka_driver_selected_hub";

export function DriverLocationSelector({
  onLocationChange,
}: {
  onLocationChange?: (location: DhakaHub) => void;
}) {
  const [selectedHubName, setSelectedHubName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && DHAKA_HUBS.some((h) => h.name === saved)) {
        return saved;
      }
    }
    return DHAKA_HUBS[0]?.name ?? "Banani (Road 11)";
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    const hub =
      DHAKA_HUBS.find((h) => h.name === selectedHubName) ?? DHAKA_HUBS[0];
    if (hub) {
      onLocationChange?.(hub);
    }
  }, [selectedHubName, onLocationChange]);

  function handleSelectHub(name: string) {
    const hub = DHAKA_HUBS.find((h) => h.name === name);
    if (hub) {
      setSelectedHubName(hub.name);
      localStorage.setItem(STORAGE_KEY, hub.name);
      setGpsError(null);
      onLocationChange?.(hub);
    }
  }

  function handleDetectGps() {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGps(false);
        const { latitude, longitude } = position.coords;

        // Find the closest Dhaka hub to the detected GPS coordinates
        let closestHub: DhakaHub = DHAKA_HUBS[0];
        let minDistanceSq = Number.POSITIVE_INFINITY;

        for (const hub of DHAKA_HUBS) {
          const dLat = hub.lat - latitude;
          const dLng = hub.lng - longitude;
          const distSq = dLat * dLat + dLng * dLng;
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestHub = hub;
          }
        }

        setSelectedHubName(closestHub.name);
        localStorage.setItem(STORAGE_KEY, closestHub.name);
        onLocationChange?.(closestHub);
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsError(err.message || "Failed to detect current location");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  const currentHub = DHAKA_HUBS.find((h) => h.name === selectedHubName) ?? DHAKA_HUBS[0];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Driver Current Location
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-950">
              {currentHub?.name ?? "Dhaka Hub"}
            </h2>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {currentHub?.area}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinates: {currentHub?.lat.toFixed(4)}, {currentHub?.lng.toFixed(4)}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="driver-hub-select" className="sr-only">
            Select Current Hub
          </label>
          <select
            id="driver-hub-select"
            className="w-full sm:w-auto flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            value={selectedHubName}
            onChange={(e) => handleSelectHub(e.target.value)}
          >
            {DHAKA_AREAS.map((area) => (
              <optgroup key={area} label={area}>
                {DHAKA_HUBS.filter((h) => h.area === area).map((hub) => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <button
            type="button"
            className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleDetectGps}
            disabled={isDetectingGps}
          >
            {isDetectingGps ? "Detecting GPS..." : "📍 GPS"}
          </button>
        </div>
      </div>

      {gpsError ? (
        <p className="mt-2 text-xs text-red-600">{gpsError}</p>
      ) : null}
    </article>
  );
}
