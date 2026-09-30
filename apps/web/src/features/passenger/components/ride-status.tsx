import type { RideStatus as RideStatusValue } from "../types/passenger.types";

const statusLabels: Record<RideStatusValue, string> = {
  REQUESTED: "Requested",
  MATCHED: "Matched",
  DRIVER_ARRIVED: "Driver arrived",
  STARTED: "Started",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusStyles: Record<RideStatusValue, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
  MATCHED: "bg-sky-100 text-sky-800 border-sky-200",
  DRIVER_ARRIVED: "bg-purple-100 text-purple-800 border-purple-200",
  STARTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function RideStatus({ status }: { status: RideStatusValue }) {
  const label = statusLabels[status] ?? status;
  const style =
    statusStyles[status] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
