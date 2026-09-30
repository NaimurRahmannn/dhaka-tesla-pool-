import type { PoolStatus as PoolStatusType } from "../types/pool.types";

const statusStyles: Record<PoolStatusType, string> = {
  MATCHING: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const lifecycleSteps: { key: PoolStatusType; label: string }[] = [
  { key: "MATCHING", label: "Matching" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
];

export type PoolStatusProps = {
  status?: PoolStatusType | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  showLifecycle?: boolean;
  className?: string;
};

export function PoolStatus({
  status,
  isLoading = false,
  errorMessage,
  showLifecycle = false,
  className = "",
}: PoolStatusProps) {
  if (isLoading) {
    return (
      <div
        data-testid="pool-status-loading"
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500 animate-pulse ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Loading status...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        data-testid="pool-status-error"
        className={`inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {errorMessage}
      </div>
    );
  }

  if (!status) {
    return (
      <div
        data-testid="pool-status-empty"
        className={`inline-flex items-center rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-400 ${className}`}
      >
        No status
      </div>
    );
  }

  const badgeStyle =
    statusStyles[status] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <span
        data-testid="pool-status-badge"
        className={`inline-flex items-center w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeStyle}`}
      >
        {status}
      </span>

      {showLifecycle && status !== "CANCELLED" ? (
        <div
          data-testid="pool-lifecycle"
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400"
        >
          {lifecycleSteps.map((step, idx) => {
            const isCurrent = step.key === status;
            const currentIndex = lifecycleSteps.findIndex(
              (s) => s.key === status,
            );
            const stepIndex = lifecycleSteps.findIndex(
              (s) => s.key === step.key,
            );
            const isPast = currentIndex > stepIndex;

            return (
              <span key={step.key} className="flex items-center gap-1">
                {idx > 0 && <span className="text-slate-300">&rarr;</span>}
                <span
                  className={
                    isCurrent
                      ? "font-bold text-emerald-700"
                      : isPast
                        ? "text-slate-600"
                        : "text-slate-400"
                  }
                >
                  {step.label}
                </span>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
