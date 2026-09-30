import Link from "next/link";
import type { DriverPool, PoolStatus } from "../types/driver.types";

const poolStatusStyles: Record<PoolStatus, string> = {
  MATCHING: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function PoolCard({ pool }: { pool: DriverPool }) {
  const badgeStyle =
    poolStatusStyles[pool.status] ??
    "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pool
          </p>
          <h3 className="truncate text-base font-semibold text-slate-950">
            {pool.id}
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
          >
            {pool.status}
          </span>
        </div>

        <Link
          href={`/driver/pools`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
        >
          View Pool
        </Link>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
        <div className="flex justify-between gap-2">
          <dt>Pooled Passengers</dt>
          <dd className="font-semibold text-slate-900">{pool.memberCount}</dd>
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <dt className="text-slate-500">Vehicle ID</dt>
          <dd className="truncate font-mono text-slate-700">{pool.vehicleId}</dd>
        </div>
      </dl>
    </article>
  );
}
