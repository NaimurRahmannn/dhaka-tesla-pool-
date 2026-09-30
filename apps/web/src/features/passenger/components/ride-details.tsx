"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/features/auth";
import { formatFare } from "@/features/passenger/utils/format-fare";
import { useRide } from "../hooks/use-ride";
import { RideStatus } from "./ride-status";

export function RideDetailsPage({ rideId }: { rideId: string }) {
  return (
    <ProtectedRoute requiredRole="PASSENGER">
      <RideDetailsContent rideId={rideId} />
    </ProtectedRoute>
  );
}

function RideDetailsContent({ rideId }: { rideId: string }) {
  const router = useRouter();
  const { ride, errorMessage, isLoading, isCancelling, cancel } =
    useRide(rideId);

  async function handleCancel() {
    try {
      await cancel();
      router.refresh();
    } catch {
      // Error is set in useRide hook
    }
  }

  const canCancel = ride?.status === "REQUESTED" || ride?.status === "MATCHED";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-10">
      <div className="mb-1">
        <Link
          href="/passenger"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          &larr; Back to your rides
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading ride...</p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {ride ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Ride details
              </p>
              <h1 className="break-words text-2xl font-semibold text-slate-950">
                {ride.id}
              </h1>
              <RideStatus status={ride.status} />
            </div>
            {canCancel ? (
              <button
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel ride"}
              </button>
            ) : null}
          </div>

          <dl className="mt-6 grid gap-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
              <dt>Status</dt>
              <dd className="font-medium text-slate-950">{ride.status}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
              <dt>Estimated fare</dt>
              <dd className="font-medium text-slate-950">
                {formatFare(ride.estimatedFarePaisa)}
              </dd>
            </div>
            {ride.pickupLat !== undefined && ride.pickupLng !== undefined ? (
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                <dt>Pickup coordinates</dt>
                <dd className="font-mono text-slate-900">
                  {Number(ride.pickupLat).toFixed(6)}, {Number(ride.pickupLng).toFixed(6)}
                </dd>
              </div>
            ) : null}
            {ride.destinationLat !== undefined && ride.destinationLng !== undefined ? (
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                <dt>Destination coordinates</dt>
                <dd className="font-mono text-slate-900">
                  {Number(ride.destinationLat).toFixed(6)}, {Number(ride.destinationLng).toFixed(6)}
                </dd>
              </div>
            ) : null}
          </dl>
        </article>
      ) : null}
    </main>
  );
}
