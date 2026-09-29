import { PoolStatus } from '../../generated/prisma/client.js';
import { canTransition } from './pool-status-machine.js';

describe('pool status machine', () => {
  it.each([
    [PoolStatus.MATCHING, PoolStatus.ACTIVE],
    [PoolStatus.MATCHING, PoolStatus.CANCELLED],
    [PoolStatus.ACTIVE, PoolStatus.COMPLETED],
    [PoolStatus.ACTIVE, PoolStatus.CANCELLED],
  ])('allows %s -> %s', (currentStatus, nextStatus) => {
    expect(canTransition(currentStatus, nextStatus)).toBe(true);
  });

  it.each([
    [PoolStatus.MATCHING, PoolStatus.COMPLETED],
    [PoolStatus.ACTIVE, PoolStatus.MATCHING],
    [PoolStatus.COMPLETED, PoolStatus.ACTIVE],
    [PoolStatus.COMPLETED, PoolStatus.CANCELLED],
    [PoolStatus.CANCELLED, PoolStatus.MATCHING],
    [PoolStatus.CANCELLED, PoolStatus.ACTIVE],
  ])('rejects %s -> %s', (currentStatus, nextStatus) => {
    expect(canTransition(currentStatus, nextStatus)).toBe(false);
  });
});
