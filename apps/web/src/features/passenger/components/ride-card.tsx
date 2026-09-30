import Link from "next/link";
import { formatFare } from "@/features/passenger/utils/format-fare";
import { RideStatus } from "./ride-status";
import type { Ride } from "../types/passenger.types";

export function RideCard({ ride }: { ride: Ride }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="truncate text-base font-semibold text-slate-950">
            Ride {ride.id}
          </h2>
          <RideStatus status={ride.status} />
        </div>
        <Link
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
          href={`/passenger/rides/${ride.id}`}
        >
          View
        </Link>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-slate-600">
        <div className="flex justify-between gap-4">
          <dt>Estimated fare</dt>
          <dd className="font-medium text-slate-900">
            {formatFare(ride.estimatedFarePaisa)}
          </dd>
        </div>
        {ride.pickupLat !== undefined && ride.pickupLng !== undefined ? (
          <div className="flex justify-between gap-4 text-xs text-slate-500">
            <dt>Pickup</dt>
            <dd className="font-mono">
              {Number(ride.pickupLat).toFixed(4)}, {Number(ride.pickupLng).toFixed(4)}
            </dd>
          </div>
        ) : null}
        {ride.destinationLat !== undefined && ride.destinationLng !== undefined ? (
          <div className="flex justify-between gap-4 text-xs text-slate-500">
            <dt>Destination</dt>
            <dd className="font-mono">
              {Number(ride.destinationLat).toFixed(4)}, {Number(ride.destinationLng).toFixed(4)}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
