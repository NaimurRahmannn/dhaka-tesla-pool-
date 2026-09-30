"use client";

import Link from "next/link";
import { UserProfileHeader } from "@/components";
import { ProtectedRoute, useAuth } from "@/features/auth";
import { usePassengerRides } from "../hooks/use-passenger-rides";
import { RideCard } from "./ride-card";

export function PassengerDashboard() {
  return (
    <ProtectedRoute requiredRole="PASSENGER">
      <PassengerDashboardContent />
    </ProtectedRoute>
  );
}

function PassengerDashboardContent() {
  const { user } = useAuth();
  const { rides, errorMessage, isLoading } = usePassengerRides();
  const activeRideCount = rides.filter((ride) =>
    ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"].includes(ride.status),
  ).length;
  const completedRideCount = rides.filter(
    (ride) => ride.status === "COMPLETED",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <UserProfileHeader />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Passenger Desk
              </p>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                Your rides
              </h1>
              <p className="text-sm text-slate-600">
                {user?.name ? `${user.name}'s Dhaka Tesla Pool trips` : "Dhaka Tesla Pool trips"}
              </p>
            </div>
            <Link
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:w-auto"
              href="/passenger/rides/new"
            >
              Request ride
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Total rides" value={rides.length} />
          <SummaryTile label="Active rides" value={activeRideCount} />
          <SummaryTile label="Completed" value={completedRideCount} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Ride history
              </h2>
              <p className="text-sm text-slate-500">
                Track requests, matched rides, and completed trips.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading rides...</p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {!isLoading && !errorMessage && rides.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No rides yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Request your first ride and it will appear here.
                </p>
              </div>
            ) : null}

            {rides.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {rides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
