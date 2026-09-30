"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/features/auth";
import { formatFare } from "@/features/passenger/utils/format-fare";
import { formatLocationName } from "@/features/passenger/utils/format-location";
import { PoolCard } from "@/features/pool";
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/passenger"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          &larr; Back to your rides
        </Link>

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading ride...</p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {ride ? (
          <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Ride details
                </p>
                <h1 className="break-words text-xl font-semibold text-slate-950 sm:text-2xl">
                  {ride.id}
                </h1>
                <RideStatus status={ride.status} />
              </div>
              {canCancel ? (
                <button
                  className="inline-flex w-full items-center justify-center rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 sm:w-auto"
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel ride"}
                </button>
              ) : null}
            </div>

            <dl className="grid gap-0 px-5 py-2 text-sm text-slate-700 sm:px-6">
              <DetailRow label="Status" value={ride.status} />
              <DetailRow
                label="Estimated fare"
                value={formatFare(ride.estimatedFarePaisa)}
              />
              {ride.pickupLat !== undefined && ride.pickupLng !== undefined ? (
                <DetailRow
                  label="Pickup location"
                  value={formatLocationName(ride.pickupLat, ride.pickupLng)}
                />
              ) : null}
              {ride.destinationLat !== undefined &&
              ride.destinationLng !== undefined ? (
                <DetailRow
                  label="Destination location"
                  value={formatLocationName(
                    ride.destinationLat,
                    ride.destinationLng,
                  )}
                />
              ) : null}
            </dl>
          </article>
        ) : null}

        {ride && (ride.pool || ride.poolId) ? (
          <section aria-label="Pool details">
            <PoolCard
              pool={
                ride.pool ?? {
                  id: ride.poolId!,
                  status:
                    ride.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
                  memberCount: 2,
                }
              }
              isPassengerView
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-slate-100 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-950 sm:text-right">
        {value}
      </dd>
    </div>
  );
}
