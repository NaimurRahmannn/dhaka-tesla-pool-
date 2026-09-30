export type PoolMembersProps = {
  count: number;
  capacity?: number;
  showLabel?: boolean;
  className?: string;
};

export function PoolMembers({
  count,
  capacity,
  showLabel = true,
  className = "",
}: PoolMembersProps) {
  const displayCount =
    typeof capacity === "number" ? `${count}/${capacity}` : `${count}`;

  return (
    <div
      data-testid="pool-members"
      className={`inline-flex items-center gap-1.5 text-sm ${className}`}
    >
      {showLabel ? (
        <span className="text-slate-500 font-medium">Members:</span>
      ) : null}
      <span
        data-testid="pool-members-count"
        className="font-semibold text-slate-900"
      >
        {displayCount}
      </span>
    </div>
  );
}
