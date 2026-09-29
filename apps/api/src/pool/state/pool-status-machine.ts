import { PoolStatus } from '../../generated/prisma/client.js';

const allowedTransitions: ReadonlyMap<PoolStatus, ReadonlySet<PoolStatus>> =
  new Map([
    [
      PoolStatus.MATCHING,
      new Set([PoolStatus.ACTIVE, PoolStatus.CANCELLED]),
    ],
    [
      PoolStatus.ACTIVE,
      new Set([PoolStatus.COMPLETED, PoolStatus.CANCELLED]),
    ],
    [PoolStatus.COMPLETED, new Set()],
    [PoolStatus.CANCELLED, new Set()],
  ]);

export function canTransition(
  currentStatus: PoolStatus,
  nextStatus: PoolStatus,
): boolean {
  return allowedTransitions.get(currentStatus)?.has(nextStatus) ?? false;
}
