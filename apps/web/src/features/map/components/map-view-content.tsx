"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates } from "../types/map.types";
import { DestinationMarker } from "./destination-marker";
import { PickupMarker } from "./pickup-marker";
import { RouteLine } from "./route-line";

// Default map center: Dhaka (Banani / Gulshan hub area)
const DHAKA_CENTER: [number, number] = [23.7806, 90.4125];
const DEFAULT_ZOOM = 12;

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export type MapViewProps = {
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  routeCoordinates?: [number, number][];
  onMapClick?: (coords: Coordinates) => void;
  onSelectPickup?: (coords: Coordinates) => void;
  onSelectDestination?: (coords: Coordinates) => void;
  selectionMode?: "pickup" | "destination" | null;
  onSelectionModeChange?: (mode: "pickup" | "destination") => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  className?: string;
  height?: string;
  readOnly?: boolean;
};

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (coords: Coordinates) => void;
}) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });
  return null;
}

function MapBoundsAdjuster({
  pickup,
  destination,
  routeCoordinates,
}: {
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  routeCoordinates?: [number, number][];
}) {
  const map = useMap();
  const lastKeyRef = useRef<string>("");

  const pickLat = pickup?.lat;
  const pickLng = pickup?.lng;
  const destLat = destination?.lat;
  const destLng = destination?.lng;
  const routeCount =
    routeCoordinates && routeCoordinates.length >= 2
      ? routeCoordinates.length
      : 0;

  const boundsKey = useMemo(() => {
    const p =
      pickLat !== undefined && pickLng !== undefined
        ? `${pickLat.toFixed(5)},${pickLng.toFixed(5)}`
        : "none";
    const d =
      destLat !== undefined && destLng !== undefined
        ? `${destLat.toFixed(5)},${destLng.toFixed(5)}`
        : "none";
    return `${p}|${d}|${routeCount}`;
  }, [pickLat, pickLng, destLat, destLng, routeCount]);

  useEffect(() => {
    if (!boundsKey || boundsKey === lastKeyRef.current) return;
    lastKeyRef.current = boundsKey;

    try {
      if (routeCoordinates && routeCoordinates.length >= 2) {
        map.fitBounds(routeCoordinates, { padding: [40, 40], maxZoom: 15, animate: false });
      } else if (pickup && destination) {
        map.fitBounds(
          [
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng],
          ],
          { padding: [50, 50], maxZoom: 15, animate: false },
        );
      } else if (pickup) {
        map.setView([pickup.lat, pickup.lng], 14, { animate: false });
      } else if (destination) {
        map.setView([destination.lat, destination.lng], 14, { animate: false });
      }
    } catch {
      // Ignore bounds adjustment errors
    }
  }, [map, boundsKey, pickup, destination, routeCoordinates]);

  return null;
}

export function MapViewContent({
  pickup,
  destination,
  routeCoordinates,
  onMapClick,
  onSelectPickup,
  onSelectDestination,
  selectionMode = null,
  onSelectionModeChange,
  isLoading = false,
  errorMessage = null,
  className = "",
  height = "380px",
  readOnly = false,
}: MapViewProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function handleMapClick(coords: Coordinates) {
    if (readOnly) return;

    if (selectionMode === "pickup" && onSelectPickup) {
      onSelectPickup(coords);
    } else if (selectionMode === "destination" && onSelectDestination) {
      onSelectDestination(coords);
    }

    if (onMapClick) {
      onMapClick(coords);
    }
  }

  return (
    <div
      data-testid="map-view"
      className={`relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm ${className}`}
      style={{ minHeight: height }}
    >
      {/* Interactive Selection Toolbar */}
      {!readOnly && onSelectionModeChange ? (
        <div
          data-testid="map-toolbar"
          className="z-[1000] flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
        >
          <span className="font-semibold text-slate-700">Map Selection:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectionModeChange("pickup")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                selectionMode === "pickup"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              1. Set Pickup
            </button>
            <button
              type="button"
              onClick={() => onSelectionModeChange("destination")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                selectionMode === "destination"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              2. Set Destination
            </button>
          </div>
        </div>
      ) : null}

      {/* Map Alerts */}
      {errorMessage ? (
        <div
          data-testid="map-error-message"
          className="z-[1000] border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          {errorMessage}
        </div>
      ) : null}

      {/* Map Rendering Container */}
      <div className="relative flex-1" style={{ minHeight: height }}>
        {!isMounted ? (
          <div
            data-testid="map-loading"
            className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-sm text-slate-500"
          >
            <span className="animate-pulse">Loading map...</span>
          </div>
        ) : (
          <MapContainer
            center={DHAKA_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-full w-full"
            style={{ minHeight: height, width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {!readOnly ? (
              <MapClickHandler onMapClick={handleMapClick} />
            ) : null}

            <MapBoundsAdjuster
              pickup={pickup}
              destination={destination}
              routeCoordinates={routeCoordinates}
            />

            {pickup ? (
              <PickupMarker
                position={pickup}
                label="Selected Pickup Point"
              />
            ) : null}

            {destination ? (
              <DestinationMarker
                position={destination}
                label="Selected Destination Point"
              />
            ) : null}

            {routeCoordinates && routeCoordinates.length >= 2 ? (
              <RouteLine coordinates={routeCoordinates} />
            ) : null}
          </MapContainer>
        )}

        {/* Loading Overlay */}
        {isLoading ? (
          <div
            data-testid="route-loading-overlay"
            className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 backdrop-blur-xs"
          >
            <div className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-md">
              Calculating route preview...
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
