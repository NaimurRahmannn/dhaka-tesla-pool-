"use client";

import { useState } from "react";
import { arriveRide, completeRide, startRide } from "../api/driver-api";
import type { RideStatus } from "../types/driver.types";

const statusBadgeStyles: Record<RideStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
  MATCHED: "bg-sky-100 text-sky-800 border-sky-200",
  DRIVER_ARRIVED: "bg-purple-100 text-purple-800 border-purple-200",
  STARTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function DriverRideActions({
  rideId,
  initialStatus = "MATCHED",
  onStatusChange,
}: {
  rideId: string;
  initialStatus?: RideStatus;
  onStatusChange?: (status: RideStatus) => void;
}) {
  const [status, setStatus] = useState<RideStatus>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleArrive() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await arriveRide(rideId);
      setStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to record arrival",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStart() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await startRide(rideId);
      setStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start ride",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await completeRide(rideId);
      setStatus(result.status);
      onStatusChange?.(result.status);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to complete ride",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const badgeStyle =
    statusBadgeStyles[status] ??
    "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Ride
            </p>
            <h2 className="break-all text-xl font-bold text-slate-950">{rideId}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <span
              data-testid="ride-status-badge"
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
            >
              {status}
            </span>
          </div>
        </div>

        {errorMessage ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-medium text-slate-600">
            Lifecycle Actions:
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
            {status === "MATCHED" ? (
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleArrive}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Arrive at pickup"}
              </button>
            ) : null}

            {status === "DRIVER_ARRIVED" ? (
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleStart}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Start ride"}
              </button>
            ) : null}

            {status === "STARTED" ? (
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Complete ride"}
              </button>
            ) : null}

            {status === "COMPLETED" ? (
              <p className="text-sm font-medium text-slate-600">
                Ride completed. No further driver actions required.
              </p>
            ) : null}

            {status === "CANCELLED" ? (
              <p className="text-sm font-medium text-red-600">
                This ride has been cancelled.
              </p>
            ) : null}

            {status === "REQUESTED" ? (
              <p className="text-sm font-medium text-amber-700">
                Ride is waiting to be matched to a vehicle pool.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
