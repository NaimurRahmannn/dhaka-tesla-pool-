import Link from "next/link";
import { formatFare } from "@/features/passenger/utils/format-fare";
import { formatLocationName } from "@/features/passenger/utils/format-location";
import { RideStatus } from "./ride-status";
import type { Ride } from "../types/passenger.types";

export function RideCard({ ride }: { ride: Ride }) {
  const pickupName =
    ride.pickupLat !== undefined && ride.pickupLng !== undefined
      ? formatLocationName(ride.pickupLat, ride.pickupLng)
      : "Pickup pending";
  const destinationName =
    ride.destinationLat !== undefined && ride.destinationLng !== undefined
      ? formatLocationName(ride.destinationLat, ride.destinationLng)
      : "Destination pending";

  const isPooled = Boolean(ride.poolId || ride.pool || ride.farePaisa);
  const displayFare =
    ride.farePaisa ??
    (isPooled
      ? Math.floor((ride.estimatedFarePaisa ?? 0) * 0.8)
      : ride.estimatedFarePaisa);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Passenger ride
              </p>
              {isPooled ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  Pooled (Bullet Tesla)
                </span>
              ) : null}
            </div>
            <h2 className="break-words text-base font-semibold text-slate-950">
              Ride {ride.id}
            </h2>
            <RideStatus status={ride.status} />
          </div>
          <Link
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 sm:w-auto"
            href={`/passenger/rides/${ride.id}`}
          >
            View
          </Link>
        </div>

        <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pickup
              </p>
              <p className="mt-1 break-words font-medium text-slate-900">
                {pickupName}
              </p>
            </div>
            <div className="hidden h-px w-10 bg-slate-300 sm:block" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Destination
              </p>
              <p className="mt-1 break-words font-medium text-slate-900">
                {destinationName}
              </p>
            </div>
          </div>
        </div>

        <dl className="grid gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <dt>{isPooled ? "Your pooled fare" : "Estimated fare"}</dt>
            <dd className="font-semibold text-slate-950 flex items-center gap-1.5">
              <span>{formatFare(displayFare)}</span>
              {isPooled ? (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  20% Split
                </span>
              ) : null}
            </dd>
          </div>
          {isPooled ? (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <span>Vehicle: {ride.pool?.vehicleName ?? "Bullet Tesla"}</span>
              <span className="font-medium text-emerald-700">Shared Pool</span>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
