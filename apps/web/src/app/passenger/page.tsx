import { ProtectedRoute } from "@/features/auth";

export default function PassengerPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-3 px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Passenger
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Passenger Workspace
        </h1>
        <p className="text-base leading-7 text-slate-700">
          Placeholder route for future ride request, fare, and trip status UI.
        </p>
      </main>
    </ProtectedRoute>
  );
}
