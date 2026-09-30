"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/features/auth";
import type { RideStatus } from "../types/driver.types";
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

          <DriverRideActions rideId={rideId} initialStatus={initialStatus} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
