"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { MapView, useMapRoute } from "@/features/map";
import type { Coordinates } from "@/features/map";
import { createRide } from "../api/passenger-api";
import type { CreateRideRequest } from "../types/passenger.types";
import {
  DHAKA_HUBS,
  DHAKA_AREAS,
  formatLocationName,
} from "../utils/format-location";

export { DHAKA_HUBS, DHAKA_AREAS };

export const ROUTE_SHORTCUTS = [
  {
    label: "Banani to Gulshan 2",
    pickup: { lat: "23.7937", lng: "90.4043" },
    destination: { lat: "23.7925", lng: "90.4078" },
  },
  {
    label: "Uttara to Bashundhara",
    pickup: { lat: "23.869", lng: "90.3986" },
    destination: { lat: "23.8103", lng: "90.4225" },
  },
  {
    label: "Dhanmondi to Shahbagh",
    pickup: { lat: "23.7533", lng: "90.3769" },
    destination: { lat: "23.738", lng: "90.3957" },
  },
  {
    label: "Gulshan 1 to Motijheel",
    pickup: { lat: "23.7797", lng: "90.4184" },
    destination: { lat: "23.733", lng: "90.4172" },
  },
] as const;

const initialForm: Record<keyof CreateRideRequest, string> = {
  pickupLat: "",
  pickupLng: "",
  destinationLat: "",
  destinationLng: "",
};

function toRideRequest(
  form: Record<keyof CreateRideRequest, string>,
): CreateRideRequest {
  return {
    pickupLat: Number(form.pickupLat),
    pickupLng: Number(form.pickupLng),
    destinationLat: Number(form.destinationLat),
    destinationLng: Number(form.destinationLng),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ride request failed";
}

export function RideForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [selectionMode, setSelectionMode] = useState<"pickup" | "destination">(
    "pickup",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const pickupCoords = useMemo<Coordinates | null>(() => {
    if (!form.pickupLat || !form.pickupLng) return null;
    const lat = Number(form.pickupLat);
    const lng = Number(form.pickupLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [form.pickupLat, form.pickupLng]);

  const destinationCoords = useMemo<Coordinates | null>(() => {
    if (!form.destinationLat || !form.destinationLng) return null;
    const lat = Number(form.destinationLat);
    const lng = Number(form.destinationLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [form.destinationLat, form.destinationLng]);

  const {
    route,
    isLoading: isRouteLoading,
    errorMessage: routeError,
  } = useMapRoute(pickupCoords, destinationCoords);

  function applyPresetRoute(shortcut: (typeof ROUTE_SHORTCUTS)[number]) {
    setForm({
      pickupLat: shortcut.pickup.lat,
      pickupLng: shortcut.pickup.lng,
      destinationLat: shortcut.destination.lat,
      destinationLng: shortcut.destination.lng,
    });
    setErrorMessage(null);
  }

  function handleSelectPickupOnMap(coords: Coordinates) {
    setForm((prev) => ({
      ...prev,
      pickupLat: coords.lat.toString(),
      pickupLng: coords.lng.toString(),
    }));
    // Auto-advance to destination selection if not yet set
    if (!form.destinationLat || !form.destinationLng) {
      setSelectionMode("destination");
    }
    setErrorMessage(null);
  }

  function handleSelectDestinationOnMap(coords: Coordinates) {
    setForm((prev) => ({
      ...prev,
      destinationLat: coords.lat.toString(),
      destinationLng: coords.lng.toString(),
    }));
    setErrorMessage(null);
  }

  function handleSelectPickupHub(coords: string) {
    if (!coords) return;
    const [lat, lng] = coords.split(",");
    setForm((prev) => ({ ...prev, pickupLat: lat, pickupLng: lng }));
    if (!form.destinationLat || !form.destinationLng) {
      setSelectionMode("destination");
    }
  }

  function handleSelectDestinationHub(coords: string) {
    if (!coords) return;
    const [lat, lng] = coords.split(",");
    setForm((prev) => ({ ...prev, destinationLat: lat, destinationLng: lng }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser.");
      return;
    }
    setGeoNotice("Detecting current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          pickupLat: pos.coords.latitude.toFixed(6),
          pickupLng: pos.coords.longitude.toFixed(6),
        }));
        setGeoNotice("Current location detected.");
      },
      () => {
        setGeoNotice("Could not access location. Please select on the map.");
      },
      { timeout: 8000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.pickupLat || !form.pickupLng) {
      setErrorMessage("Please select a pickup location on the map.");
      return;
    }

    if (!form.destinationLat || !form.destinationLng) {
      setErrorMessage("Please select a destination location on the map.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const ride = await createRide(toRideRequest(form));
      router.push(`/passenger/rides/${ride.id}`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const pickupName =
    form.pickupLat && form.pickupLng
      ? formatLocationName(form.pickupLat, form.pickupLng)
      : null;

  const destinationName =
    form.destinationLat && form.destinationLng
      ? formatLocationName(form.destinationLat, form.destinationLng)
      : null;

  return (
    <form
      className="grid w-full gap-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Link
          href="/passenger"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          &larr; Back to your rides
        </Link>
        <h1 className="text-2xl font-semibold text-slate-950">
          Request a ride
        </h1>
        <p className="text-sm text-slate-600">
          Choose a pickup and destination on the map. View the route preview before submitting.
        </p>
      </div>

      {/* Map Selection Section */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Map Route Selection
          </p>
          <span className="text-xs text-slate-500">
            {selectionMode === "pickup"
              ? "Click map to set Pickup point"
              : "Click map to set Destination point"}
          </span>
        </div>

        <MapView
          pickup={pickupCoords}
          destination={destinationCoords}
          routeCoordinates={route?.coordinates}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          onSelectPickup={handleSelectPickupOnMap}
          onSelectDestination={handleSelectDestinationOnMap}
          isLoading={isRouteLoading}
          errorMessage={routeError}
          height="340px"
        />

        {/* Selected Coordinates Display */}
        <div
          data-testid="selected-coordinates-summary"
          className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 text-xs"
        >
          <div className="space-y-1">
            <span className="font-semibold text-emerald-800">
              Pickup Point:
            </span>{" "}
            {pickupCoords ? (
              <span
                data-testid="selected-pickup-coords"
                className="font-mono text-slate-800"
              >
                {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
                {pickupName ? ` (${pickupName})` : ""}
              </span>
            ) : (
              <span className="italic text-slate-400">Not selected yet</span>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-red-800">
              Destination Point:
            </span>{" "}
            {destinationCoords ? (
              <span
                data-testid="selected-destination-coords"
                className="font-mono text-slate-800"
              >
                {destinationCoords.lat.toFixed(5)},{" "}
                {destinationCoords.lng.toFixed(5)}
                {destinationName ? ` (${destinationName})` : ""}
              </span>
            ) : (
              <span className="italic text-slate-400">Not selected yet</span>
            )}
          </div>
        </div>

        {/* Route Preview Panel */}
        {route ? (
          <div
            data-testid="route-preview"
            className="flex flex-col gap-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-wider text-emerald-800">
                Route Preview
              </p>
              <p className="text-slate-600">
                Route and distance calculated via backend routing provider
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-500 block">Distance</span>
                <span
                  data-testid="route-preview-distance"
                  className="text-base font-bold text-slate-900"
                >
                  {route.distanceKm} km
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Est. Duration</span>
                <span
                  data-testid="route-preview-duration"
                  className="text-base font-bold text-slate-900"
                >
                  {route.durationMinutes} mins
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Route Shortcuts & Landmark Selectors */}
      <details className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-slate-700 hover:text-emerald-700">
          Popular Landmarks & Trips (Optional Shortcuts)
        </summary>
        <div className="mt-3 space-y-4 pt-2 border-t border-slate-200">
          <div>
            <p className="mb-2 font-medium text-slate-600">Popular Trips</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROUTE_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => applyPresetRoute(shortcut)}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 shadow-xs transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="pickup-select"
                  className="font-medium text-slate-700"
                >
                  Pickup Landmark
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  Use current location
                </button>
              </div>
              {geoNotice ? (
                <p className="text-[11px] text-slate-500 mb-1">{geoNotice}</p>
              ) : null}
              <select
                id="pickup-select"
                aria-label="Select popular pickup landmark"
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                onChange={(e) => handleSelectPickupHub(e.target.value)}
                value={
                  form.pickupLat && form.pickupLng
                    ? `${form.pickupLat},${form.pickupLng}`
                    : ""
                }
              >
                <option value="" disabled>
                  -- Select landmark --
                </option>
                {DHAKA_AREAS.map((area) => (
                  <optgroup key={area} label={area}>
                    {DHAKA_HUBS.filter((hub) => hub.area === area).map((hub) => (
                      <option key={hub.name} value={`${hub.lat},${hub.lng}`}>
                        {hub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="destination-select"
                className="block font-medium text-slate-700 mb-1"
              >
                Destination Landmark
              </label>
              <select
                id="destination-select"
                aria-label="Select popular destination landmark"
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                onChange={(e) => handleSelectDestinationHub(e.target.value)}
                value={
                  form.destinationLat && form.destinationLng
                    ? `${form.destinationLat},${form.destinationLng}`
                    : ""
                }
              >
                <option value="" disabled>
                  -- Select landmark --
                </option>
                {DHAKA_AREAS.map((area) => (
                  <optgroup key={area} label={area}>
                    {DHAKA_HUBS.filter((hub) => hub.area === area).map((hub) => (
                      <option key={hub.name} value={`${hub.lat},${hub.lng}`}>
                        {hub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>
      </details>

      {/* Hidden coordinate inputs for form submission and test compatibility */}
      <div className="sr-only">
        <CoordinateInput
          label="Pickup latitude"
          name="pickupLat"
          value={form.pickupLat}
          onChange={(value) => setForm({ ...form, pickupLat: value })}
        />
        <CoordinateInput
          label="Pickup longitude"
          name="pickupLng"
          value={form.pickupLng}
          onChange={(value) => setForm({ ...form, pickupLng: value })}
        />
        <CoordinateInput
          label="Destination latitude"
          name="destinationLat"
          value={form.destinationLat}
          onChange={(value) => setForm({ ...form, destinationLat: value })}
        />
        <CoordinateInput
          label="Destination longitude"
          name="destinationLng"
          value={form.destinationLng}
          onChange={(value) => setForm({ ...form, destinationLng: value })}
        />
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Requesting ride..." : "Request ride"}
      </button>
    </form>
  );
}

function CoordinateInput({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: keyof CreateRideRequest;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type="number"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
