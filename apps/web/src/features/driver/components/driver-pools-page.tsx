"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/features/auth";
import { useDriverPools } from "../hooks/use-driver-pools";
import { PoolCard } from "./pool-card";

export function DriverPoolsPage() {
  return (
    <ProtectedRoute requiredRole="DRIVER">
      <DriverPoolsContent />
    </ProtectedRoute>
  );
}

function DriverPoolsContent() {
  const { pools, isLoading, errorMessage } = useDriverPools();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/driver"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            &larr; Back to Driver Workspace
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Assigned Pools
          </h1>
          <p className="text-sm text-slate-600">
            View all vehicle ride-pooling groups assigned to you.
          </p>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading assigned pools...</p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && pools.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No pools currently assigned.
        </div>
      ) : null}

      {pools.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
