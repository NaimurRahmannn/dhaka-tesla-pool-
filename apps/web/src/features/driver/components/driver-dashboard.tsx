"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute, useAuth } from "@/features/auth";
import { DHAKA_HUBS, type DhakaHub } from "@/features/passenger/utils/format-location";
import { useAssignedRides } from "../hooks/use-assigned-rides";
import { useDriverPools } from "../hooks/use-driver-pools";
import { useNearbyRides } from "../hooks/use-nearby-rides";
import type { VehicleStatus } from "../types/driver.types";
import { AssignedRidesCard } from "./assigned-rides-card";
import { DriverLocationSelector } from "./driver-location-selector";
import { NearbyRidesSection } from "./nearby-rides-section";
import { PoolCard } from "./pool-card";
import { VehicleStatusCard } from "./vehicle-status-card";

export function DriverDashboard() {
  return (
    <ProtectedRoute requiredRole="DRIVER">
      <DriverDashboardContent />
    </ProtectedRoute>
  );
}

function DriverDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { pools, isLoading: isPoolsLoading, errorMessage: poolsError } = useDriverPools();
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>("OFFLINE");
  const [currentLocation, setCurrentLocation] = useState<DhakaHub>(DHAKA_HUBS[0] ?? {
    name: "Banani (Road 11)",
    area: "Gulshan & Banani",
    lat: 23.7937,
    lng: 90.4043,
  });
  const [quickRideId, setQuickRideId] = useState("");

  const {
    assignedRides,
    isLoading: isAssignedLoading,
    errorMessage: assignedError,
    actionRideId,
    refreshAssignedRides,
    arrive,
    start,
    complete,
  } = useAssignedRides();

  const isVehicleOnline = vehicleStatus === "ONLINE";

  const {
    nearbyRides,
    isLoading: isNearbyLoading,
    isAssigning,
    errorMessage: nearbyError,
    refreshNearbyRides,
    accept,
    autoAssign,
  } = useNearbyRides({
    lat: currentLocation?.lat,
    lng: currentLocation?.lng,
    isOnline: isVehicleOnline,
  });

  const handleLocationChange = useCallback((loc: DhakaHub) => {
    setCurrentLocation(loc);
  }, []);

  const handleAcceptRide = async (rideId: string) => {
    await accept(rideId);
    await refreshAssignedRides();
  };

  const handleAutoAssign = async () => {
    await autoAssign();
    await refreshAssignedRides();
  };

  const activePools = pools.filter((p) => p.status === "ACTIVE").length;
  const matchingPools = pools.filter((p) => p.status === "MATCHING").length;
  const totalPassengers = pools.reduce((acc, p) => acc + p.memberCount, 0);

  function handleNavigateToRide(e: React.FormEvent) {
    e.preventDefault();
    if (quickRideId.trim()) {
      router.push(`/driver/rides/${quickRideId.trim()}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Driver Workspace
          </p>
          <h1 className="text-3xl font-bold text-slate-950">
            Welcome back, {user?.name ?? "Driver"}
          </h1>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-medium text-slate-900">{user?.email}</span>
          </p>
        </div>

        <Link
          href="/driver/pools"
          className="rounded-md bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          View Assigned Pools
        </Link>
      </header>

      {/* Driver Location Selector */}
      <section>
        <DriverLocationSelector onLocationChange={handleLocationChange} />
      </section>

      {/* Vehicle Status Card */}
      <section>
        <VehicleStatusCard
          vehicleId={pools[0]?.vehicleId}
          onStatusChange={setVehicleStatus}
        />
      </section>

      {/* Active Assigned Rides Card (Automatic Ride Management) */}
      <section>
        <AssignedRidesCard
          assignedRides={assignedRides}
          isLoading={isAssignedLoading}
          actionRideId={actionRideId}
          errorMessage={assignedError}
          onArrive={arrive}
          onStart={start}
          onComplete={complete}
          onRefresh={refreshAssignedRides}
        />
      </section>

      {/* Live Nearby Dispatch Feed with Proximity Filtering & Auto-Assign */}
      <section>
        <NearbyRidesSection
          nearbyRides={nearbyRides}
          isLoading={isNearbyLoading}
          isAssigning={isAssigning}
          isOnline={isVehicleOnline}
          currentLocationName={currentLocation.name}
          errorMessage={nearbyError}
          onAccept={handleAcceptRide}
          onAutoAssign={handleAutoAssign}
          onRefresh={refreshNearbyRides}
        />
      </section>

      {/* Quick Ride Action Finder */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Manual Ride Lookup (Optional)
        </h2>
        <form
          onSubmit={handleNavigateToRide}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            placeholder="Enter Ride ID (e.g. UUID) if needed"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            value={quickRideId}
            onChange={(e) => setQuickRideId(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Open Ride Actions
          </button>
        </form>
      </section>

      {/* Pool Summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">Pool Summary</h2>
          <Link
            href="/driver/pools"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            See all ({pools.length}) &rarr;
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Pools</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{pools.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Active Pools</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{activePools}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Matching</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{matchingPools}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Passengers</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{totalPassengers}</p>
          </div>
        </div>

        {isPoolsLoading ? (
          <p className="text-sm text-slate-600">Loading assigned pools...</p>
        ) : null}

        {poolsError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {poolsError}
          </p>
        ) : null}

        {!isPoolsLoading && !poolsError && pools.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            No pools assigned to this driver yet.
          </div>
        ) : null}

        {pools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {pools.slice(0, 4).map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
