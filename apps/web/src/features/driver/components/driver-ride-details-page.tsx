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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-10">
        <div className="mb-1">
          <Link
            href="/driver"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            &larr; Back to Driver Workspace
          </Link>
        </div>

        <DriverRideActions rideId={rideId} initialStatus={initialStatus} />
      </main>
    </ProtectedRoute>
  );
}
