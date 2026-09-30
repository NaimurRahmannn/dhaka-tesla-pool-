import Link from "next/link";
import { formatLocationName } from "@/features/passenger/utils/format-location";
import type { AssignedRide } from "../types/driver.types";

export function CompletedRidesCard({
  completedRides,
  errorMessage,
  isLoading,
  onRefresh,
}: {
  completedRides: AssignedRide[];
  errorMessage: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed Trip History
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Finished Passenger Trips ({completedRides.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading && completedRides.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading completed rides...</p>
      ) : null}

      {!isLoading && completedRides.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No completed trips yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Finished passenger trips will stay here after they leave the active
            ride list.
          </p>
        </div>
      ) : null}

      {completedRides.length > 0 ? (
        <div className="mt-4 space-y-3">
          {completedRides.map((ride) => {
            const pickupName = formatLocationName(ride.pickupLat, ride.pickupLng);
            const destinationName = formatLocationName(
              ride.destinationLat,
              ride.destinationLng,
            );

            return (
              <div
                key={ride.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {ride.passengerName}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      COMPLETED
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-900">{pickupName}</span>
                    <span>&rarr;</span>
                    <span className="font-medium text-slate-900">
                      {destinationName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Fare:{" "}
                    <span className="font-semibold text-slate-800">
                      BDT {(ride.farePaisa / 100).toFixed(0)}
                    </span>{" "}
                    | ID: <span className="font-mono">{ride.id.slice(0, 8)}...</span>
                  </p>
                </div>
                <Link
                  href={`/driver/rides/${ride.id}`}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
