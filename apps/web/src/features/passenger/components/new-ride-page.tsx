"use client";

import { ProtectedRoute } from "@/features/auth";
import { RideForm } from "./ride-form";

export function NewRidePage() {
  return (
    <ProtectedRoute requiredRole="PASSENGER">
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <RideForm />
        </div>
      </main>
    </ProtectedRoute>
  );
}
