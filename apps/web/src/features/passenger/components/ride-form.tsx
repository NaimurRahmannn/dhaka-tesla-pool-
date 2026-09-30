"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createRide } from "../api/passenger-api";
import type { CreateRideRequest } from "../types/passenger.types";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return (
    <form
      className="grid w-full gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
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
          Enter pickup and destination coordinates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CoordinateInput
          label="Pickup latitude"
          name="pickupLat"
          placeholder="e.g. 23.7806"
          value={form.pickupLat}
          onChange={(value) => setForm({ ...form, pickupLat: value })}
        />
        <CoordinateInput
          label="Pickup longitude"
          name="pickupLng"
          placeholder="e.g. 90.4074"
          value={form.pickupLng}
          onChange={(value) => setForm({ ...form, pickupLng: value })}
        />
        <CoordinateInput
          label="Destination latitude"
          name="destinationLat"
          placeholder="e.g. 23.8103"
          value={form.destinationLat}
          onChange={(value) => setForm({ ...form, destinationLat: value })}
        />
        <CoordinateInput
          label="Destination longitude"
          name="destinationLng"
          placeholder="e.g. 90.4125"
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
  placeholder,
  onChange,
  value,
}: {
  label: string;
  name: keyof CreateRideRequest;
  placeholder?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
      {label}
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        name={name}
        type="number"
        step="any"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
