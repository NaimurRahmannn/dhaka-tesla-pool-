"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
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
    label: "Banani → Gulshan 2",
    pickup: { lat: "23.7937", lng: "90.4043" },
    destination: { lat: "23.7925", lng: "90.4078" },
  },
  {
    label: "Uttara → Bashundhara",
    pickup: { lat: "23.869", lng: "90.3986" },
    destination: { lat: "23.8103", lng: "90.4225" },
  },
  {
    label: "Dhanmondi → Shahbagh",
    pickup: { lat: "23.7533", lng: "90.3769" },
    destination: { lat: "23.738", lng: "90.3957" },
  },
  {
    label: "Gulshan 1 → Motijheel",
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  function applyPresetRoute(shortcut: (typeof ROUTE_SHORTCUTS)[number]) {
    setForm({
      pickupLat: shortcut.pickup.lat,
      pickupLng: shortcut.pickup.lng,
      destinationLat: shortcut.destination.lat,
      destinationLng: shortcut.destination.lng,
    });
    setErrorMessage(null);
  }

  function handleSelectPickupHub(coords: string) {
    if (!coords) return;
    const [lat, lng] = coords.split(",");
    setForm((prev) => ({ ...prev, pickupLat: lat, pickupLng: lng }));
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
        setGeoNotice("Could not access location. Please select a landmark.");
      },
      { timeout: 8000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.pickupLat || !form.pickupLng) {
      setErrorMessage("Please select a pickup location.");
      return;
    }

    if (!form.destinationLat || !form.destinationLng) {
      setErrorMessage("Please select a destination location.");
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
      className="grid w-full gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1">
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
          Select your pickup and destination in Dhaka.
        </p>
      </div>

      {/* Quick Route Shortcuts */}
      <div className="space-y-2 rounded-lg bg-slate-50 p-4 border border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Popular Trips
        </p>
        <div className="flex flex-wrap gap-2">
          {ROUTE_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => applyPresetRoute(shortcut)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700 active:scale-95"
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pickup Section */}
      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="pickup-select"
            className="text-sm font-semibold text-slate-900"
          >
            1. Pickup Location
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>📍 Use current location</span>
          </button>
        </div>

        {geoNotice ? (
          <p className="text-xs text-slate-600">{geoNotice}</p>
        ) : null}

        <select
          id="pickup-select"
          aria-label="Select popular pickup landmark"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-600"
          onChange={(e) => handleSelectPickupHub(e.target.value)}
          value={
            form.pickupLat && form.pickupLng
              ? `${form.pickupLat},${form.pickupLng}`
              : ""
          }
        >
          <option value="" disabled>
            -- Choose pickup landmark --
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

        {pickupName ? (
          <p className="text-xs font-medium text-emerald-800">
            Selected pickup: {pickupName}
          </p>
        ) : null}
      </div>

      {/* Destination Section */}
      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <label
          htmlFor="destination-select"
          className="text-sm font-semibold text-slate-900"
        >
          2. Destination Location
        </label>

        <select
          id="destination-select"
          aria-label="Select popular destination landmark"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-600"
          onChange={(e) => handleSelectDestinationHub(e.target.value)}
          value={
            form.destinationLat && form.destinationLng
              ? `${form.destinationLat},${form.destinationLng}`
              : ""
          }
        >
          <option value="" disabled>
            -- Choose destination landmark --
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

        {destinationName ? (
          <p className="text-xs font-medium text-emerald-800">
            Selected destination: {destinationName}
          </p>
        ) : null}
      </div>

      {/* Hidden coordinate inputs for backend form submission and test compatibility */}
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
        className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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


