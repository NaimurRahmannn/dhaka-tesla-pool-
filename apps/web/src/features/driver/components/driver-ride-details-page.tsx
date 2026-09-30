"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/features/auth";
import { MapView, useMapRoute } from "@/features/map";
import { getAssignedRides } from "../api/driver-api";
import type { AssignedRide, RideStatus } from "../types/driver.types";
import { DriverRideActions } from "./driver-ride-actions";

export function DriverRideDetailsPage({
  rideId,
  initialStatus,
}: {
  rideId: string;
  initialStatus?: RideStatus;
}) {
  return (
    <ProtectedRoute requiredRole="DRIVER">
      <DriverRideDetailsContent rideId={rideId} initialStatus={initialStatus} />
    </ProtectedRoute>
  );
}

function DriverRideDetailsContent({
  rideId,
  initialStatus,
}: {
  rideId: string;
  initialStatus?: RideStatus;
}) {
  const [assignedRide, setAssignedRide] = useState<AssignedRide | null>(null);

  useEffect(() => {
    let ignore = false;

    getAssignedRides()
      .then((rides) => {
        if (!ignore) {
          const found = rides.find((r) => r.id === rideId) ?? null;
          setAssignedRide(found);
        }
      })
      .catch(() => {
        // Route information is optional if ride is completed or not found in assigned list
      });

    return () => {
      ignore = true;
    };
  }, [rideId]);

  const pickup =
    assignedRide && assignedRide.pickupLat && assignedRide.pickupLng
      ? { lat: assignedRide.pickupLat, lng: assignedRide.pickupLng }
      : null;

  const destination =
    assignedRide && assignedRide.destinationLat && assignedRide.destinationLng
      ? { lat: assignedRide.destinationLat, lng: assignedRide.destinationLng }
      : null;

  const { route, isLoading: isRouteLoading } = useMapRoute(pickup, destination);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-1">
          <Link
            href="/driver"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            &larr; Back to Driver Workspace
          </Link>
        </div>

        {/* Route Visualization when ride route information exists */}
        {pickup && destination ? (
          <section
            data-testid="driver-route-visualization"
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Assigned Route Visualization
                </h2>
                <p className="text-xs text-slate-500">
                  Pickup and destination route corridor
                </p>
              </div>

              {route ? (
                <span
                  data-testid="driver-route-metrics"
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"
                >
                  {route.distanceKm} km &bull; ~{route.durationMinutes} mins
                </span>
              ) : null}
            </div>

            <MapView
              pickup={pickup}
              destination={destination}
              routeCoordinates={route?.coordinates}
              isLoading={isRouteLoading}
              readOnly
              height="300px"
            />

            <dl className="grid gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
              <div className="space-y-0.5">
                <dt className="font-semibold text-emerald-800">Pickup Location</dt>
                <dd
                  data-testid="driver-pickup-coords"
                  className="font-mono text-slate-700"
                >
                  {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
                </dd>
              </div>

              <div className="space-y-0.5">
                <dt className="font-semibold text-red-800">Destination Location</dt>
                <dd
                  data-testid="driver-destination-coords"
                  className="font-mono text-slate-700"
                >
                  {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        <DriverRideActions
          rideId={rideId}
          initialStatus={assignedRide?.status ?? initialStatus}
        />
      </div>
    </main>
  );
}
