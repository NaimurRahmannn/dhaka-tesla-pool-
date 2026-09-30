import type { Pool } from "../types/pool.types";
import { PoolMembers } from "./pool-members";
import { PoolStatus } from "./pool-status";

export type PoolCardProps = {
  pool: Pool;
  isPassengerView?: boolean;
  vehicleName?: string;
  capacity?: number;
  className?: string;
};

export function PoolCard({
  pool,
  isPassengerView = false,
  vehicleName = "Bullet Tesla",
  capacity = 3,
  className = "",
}: PoolCardProps) {
  if (isPassengerView) {
    return (
      <article
        data-testid="pool-card-passenger"
        className={`rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
          <h2 className="text-sm font-semibold text-emerald-900 uppercase tracking-wider">
            Your ride is pooled
          </h2>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Pool:</dt>
            <dd
              data-testid="pool-card-id"
              className="font-mono text-sm font-semibold text-slate-900 break-all"
            >
              {pool.id}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Status:</dt>
            <dd>
              <PoolStatus status={pool.status} showLifecycle />
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Members:</dt>
            <dd>
              <PoolMembers count={pool.memberCount} showLabel={false} />
            </dd>
          </div>
        </dl>
      </article>
    );
  }

  const effectiveVehicle = pool.vehicleName ?? vehicleName;
  const effectiveCapacity = pool.capacity ?? capacity;

  return (
    <article
      data-testid="pool-card-driver"
      className={`rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-slate-300 hover:shadow ${className}`}
    >
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Pool:
          </p>
          <h3
            data-testid="pool-card-id"
            className="break-all font-mono text-base font-semibold text-slate-950"
          >
            {pool.id}
          </h3>
        </div>

        <dl className="grid gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Vehicle:</dt>
            <dd
              data-testid="pool-card-vehicle"
              className="font-semibold text-slate-900"
            >
              {effectiveVehicle}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Status:</dt>
            <dd>
              <PoolStatus status={pool.status} showLifecycle />
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-medium text-slate-500">Members:</dt>
            <dd>
              <PoolMembers
                count={pool.memberCount}
                capacity={effectiveCapacity}
                showLabel={false}
              />
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
