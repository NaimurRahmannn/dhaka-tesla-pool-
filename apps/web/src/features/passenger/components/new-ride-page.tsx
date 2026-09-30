"use client";

import { ProtectedRoute } from "@/features/auth";
import { RideForm } from "./ride-form";

export function NewRidePage() {
  return (
    <ProtectedRoute requiredRole="PASSENGER">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <RideForm />
      </main>
    </ProtectedRoute>
  );
}
