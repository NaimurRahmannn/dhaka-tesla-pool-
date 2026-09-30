"use client";

import { formatLocationName } from "@/features/passenger/utils/format-location";
import type { NearbyRide } from "../types/driver.types";

export function NearbyRidesSection({
  nearbyRides,
  isLoading,
  isAssigning,
  isOnline,
  currentLocationName,
  errorMessage,
  onAccept,
  onAutoAssign,
  onRefresh,
}: {
  nearbyRides: NearbyRide[];
  isLoading: boolean;
  isAssigning: boolean;
  isOnline: boolean;
  currentLocationName: string;
  errorMessage: string | null;
  onAccept: (rideId: string) => Promise<void>;
  onAutoAssign: () => Promise<void>;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Dispatch Feed
            </p>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Within 3 km of {currentLocationName}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-950 mt-1">
            Available Nearby Rides ({nearbyRides.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtered by distance to avoid cross-city gridlock. Drivers in Old Dhaka only see southern trips; Banani/Gulshan trips are kept local.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            disabled={!isOnline || nearbyRides.length === 0 || isAssigning}
            onClick={onAutoAssign}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isAssigning ? "Assigning..." : "⚡ Auto-Assign Closest Ride"}
          </button>
          <button
            type="button"
            disabled={!isOnline || isLoading}
            onClick={onRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Refresh"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isOnline ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm font-semibold text-amber-900">
            Vehicle is currently OFFLINE
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Click <strong>&quot;Go Online&quot;</strong> in the Vehicle Status card above to receive and accept nearby passenger ride requests.
          </p>
        </div>
      ) : null}

      {isOnline && isLoading && nearbyRides.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Scanning for available passenger rides near {currentLocationName}...
        </p>
      ) : null}

      {isOnline && !isLoading && nearbyRides.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No passenger requests near {currentLocationName} right now
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Only rides with pickup within 3 km will appear here. When a passenger books a ride in this area, you can accept it or tap Auto-Assign.
          </p>
        </div>
      ) : null}

      {isOnline && nearbyRides.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {nearbyRides.map((ride) => {
            const pickupName = formatLocationName(ride.pickupLat, ride.pickupLng);
            const destinationName = formatLocationName(
              ride.destinationLat,
              ride.destinationLng,
            );
            const distanceText =
              ride.distanceMeter < 1000
                ? `${ride.distanceMeter}m away`
                : `${(ride.distanceMeter / 1000).toFixed(1)} km away`;

            return (
              <div
                key={ride.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      📍 {distanceText}
                    </span>
                    <span className="text-xs text-slate-500">
                      {ride.requestedSeats} {ride.requestedSeats === 1 ? "seat" : "seats"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {ride.passengerName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{pickupName}</span>
                      <span>&rarr;</span>
                      <span className="font-semibold text-slate-900">{destinationName}</span>
                    </div>
                  </div>

                  {ride.estimatedFarePaisa ? (
                    <p className="text-xs text-slate-500">
                      Estimated Fare:{" "}
                      <span className="font-semibold text-emerald-700">
                        ৳{(ride.estimatedFarePaisa / 100).toFixed(0)}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    ID: {ride.id.slice(0, 8)}...
                  </span>
                  <button
                    type="button"
                    disabled={isAssigning}
                    onClick={() => onAccept(ride.id)}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isAssigning ? "Accepting..." : "Accept Ride"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
