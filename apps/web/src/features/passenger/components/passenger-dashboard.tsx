"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/features/auth";
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
  const { rides, errorMessage, isLoading } = usePassengerRides();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Passenger
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">
            Your rides
          </h1>
        </div>
        <Link
          className="rounded-md bg-emerald-700 px-4 py-2 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          href="/passenger/rides/new"
        >
          New ride
        </Link>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading rides...</p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && rides.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No rides yet.
        </p>
      ) : null}

      {rides.length > 0 ? (
        <section className="grid gap-4">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
