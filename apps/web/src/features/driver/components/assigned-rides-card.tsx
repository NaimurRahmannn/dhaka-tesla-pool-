"use client";

import Link from "next/link";
import { formatLocationName } from "@/features/passenger/utils/format-location";
import type { AssignedRide } from "../types/driver.types";

export function AssignedRidesCard({
  assignedRides,
  isLoading,
  actionRideId,
  errorMessage,
  onArrive,
  onStart,
  onComplete,
  onRefresh,
}: {
  assignedRides: AssignedRide[];
  isLoading: boolean;
  actionRideId: string | null;
  errorMessage: string | null;
  onArrive: (rideId: string) => Promise<void>;
  onStart: (rideId: string) => Promise<void>;
  onComplete: (rideId: string) => Promise<void>;
  onRefresh: () => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Assigned Rides
          </p>
          <h2 className="text-xl font-bold text-slate-950 mt-1">
            Current Passenger Trips ({assignedRides.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading && assignedRides.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading assigned rides...</p>
      ) : null}

      {!isLoading && assignedRides.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No active rides currently assigned
          </p>
          <p className="mt-1 text-xs text-slate-500">
            When you accept a nearby ride or use auto-assign, your active passenger trips will appear here with one-click actions.
          </p>
        </div>
      ) : null}

      {assignedRides.length > 0 ? (
        <div className="mt-4 space-y-4">
          {assignedRides.map((ride) => {
            const pickupName = formatLocationName(ride.pickupLat, ride.pickupLng);
            const destinationName = formatLocationName(
              ride.destinationLat,
              ride.destinationLng,
            );
            const isActing = actionRideId === ride.id;

            return (
              <div
                key={ride.id}
                className="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {ride.passengerName}
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                      {ride.requestedSeats} {ride.requestedSeats === 1 ? "seat" : "seats"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        ride.status === "STARTED"
                          ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                          : ride.status === "DRIVER_ARRIVED"
                          ? "border-blue-200 bg-blue-100 text-blue-800"
                          : "border-amber-200 bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ride.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-900">{pickupName}</span>
                    <span>&rarr;</span>
                    <span className="font-medium text-slate-900">{destinationName}</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Fare: <span className="font-semibold text-slate-800">৳{(ride.farePaisa / 100).toFixed(0)}</span> | ID: <span className="font-mono">{ride.id.slice(0, 8)}...</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ride.status === "MATCHED" ? (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => onArrive(ride.id)}
                      className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isActing ? "Updating..." : "Arrived at Pickup"}
                    </button>
                  ) : null}

                  {ride.status === "DRIVER_ARRIVED" ? (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => onStart(ride.id)}
                      className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isActing ? "Updating..." : "Start Ride"}
                    </button>
                  ) : null}

                  {ride.status === "STARTED" ? (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => onComplete(ride.id)}
                      className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isActing ? "Updating..." : "Complete Ride"}
                    </button>
                  ) : null}

                  <Link
                    href={`/driver/rides/${ride.id}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
