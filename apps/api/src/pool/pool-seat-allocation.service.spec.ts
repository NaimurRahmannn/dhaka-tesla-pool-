import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../users/prisma.service.js';
import { PoolSeatAllocationService } from './pool-seat-allocation.service.js';

type PoolRecord = {
  id: string;
  vehicleId: string;
  vehicle: {
    capacity: number;
  };
};

type RideRecord = {
  id: string;
  requestedSeats: number;
  estimatedFarePaisa: number | null;
};

type PoolMemberRecord = {
  poolId: string;
  rideRequestId: string;
  seatCount: number;
  farePaisa: number;
};

type AllocationState = {
  pools: PoolRecord[];
  rides: RideRecord[];
  members: PoolMemberRecord[];
};

function createLock() {
  let locked = false;
  const waitingResolvers: Array<() => void> = [];

  return async function acquire(): Promise<() => void> {
    if (locked) {
      await new Promise<void>((resolve) => {
        waitingResolvers.push(resolve);
      });
    }

    locked = true;

    return () => {
      const nextResolver = waitingResolvers.shift();

      if (nextResolver) {
        nextResolver();
        return;
      }

      locked = false;
    };
  };
}

function createPrismaMock(
  initialState: AllocationState,
  options: { failMembershipCreation?: boolean } = {},
) {
  const committed: AllocationState = structuredClone(initialState);
  const acquirePoolLock = createLock();
  const lockCalls: Array<ReturnType<typeof vi.fn>> = [];
  const aggregateCalls: Array<ReturnType<typeof vi.fn>> = [];

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        let staged: AllocationState | undefined;
        let releasePoolLock: (() => void) | undefined;

        const ensureStaged = () => {
          staged ??= structuredClone(committed);

          return staged;
        };

        const lockPool = vi.fn(async () => {
          releasePoolLock = await acquirePoolLock();
          staged = structuredClone(committed);

          return ensureStaged().pools.map(({ id }) => ({ id }));
        });
        const aggregateSeats = vi.fn(
          async ({ where }: { where: { poolId: string } }) => {
            const seatCount = ensureStaged().members
              .filter(({ poolId }) => poolId === where.poolId)
              .reduce((total, member) => total + member.seatCount, 0);

            return {
              _sum: {
                seatCount,
              },
            };
          },
        );

        lockCalls.push(lockPool);
        aggregateCalls.push(aggregateSeats);

        const transaction = {
          $queryRaw: lockPool,
          poolMember: {
            aggregate: aggregateSeats,
            create: vi.fn(
              async ({
                data,
              }: {
                data: PoolMemberRecord;
              }) => {
                if (options.failMembershipCreation) {
                  throw new Error('membership creation failed');
                }

                ensureStaged().members.push(data);

                return data;
              },
            ),
          },
          pool: {
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
              const pool = ensureStaged().pools.find(
                ({ id }) => id === where.id,
              );

              return pool
                ? {
                    id: pool.id,
                    vehicle: pool.vehicle,
                  }
                : null;
            }),
          },
          rideRequest: {
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
              const ride = ensureStaged().rides.find(
                ({ id }) => id === where.id,
              );

              return ride ?? null;
            }),
          },
        };

        try {
          const result = await callback(transaction);
          const finalState = ensureStaged();

          committed.pools = finalState.pools;
          committed.rides = finalState.rides;
          committed.members = finalState.members;

          return result;
        } finally {
          releasePoolLock?.();
        }
      },
    ),
  } as unknown as PrismaService;

  return {
    aggregateCalls,
    committed,
    lockCalls,
    prisma,
  };
}

function createInitialState(overrides: Partial<AllocationState> = {}) {
  return {
    pools: [
      {
        id: 'pool-id',
        vehicleId: 'vehicle-id',
        vehicle: {
          capacity: 3,
        },
      },
    ],
    rides: [
      {
        id: 'ride-id',
        requestedSeats: 1,
        estimatedFarePaisa: 5600,
      },
    ],
    members: [
      {
        poolId: 'pool-id',
        rideRequestId: 'existing-ride-id',
        seatCount: 1,
        farePaisa: 6000,
      },
    ],
    ...overrides,
  };
}

async function createService(
  state = createInitialState(),
  options: { failMembershipCreation?: boolean } = {},
) {
  const { aggregateCalls, committed, lockCalls, prisma } = createPrismaMock(
    state,
    options,
  );
  const module = await Test.createTestingModule({
    providers: [
      PoolSeatAllocationService,
      {
        provide: PrismaService,
        useValue: prisma,
      },
    ],
  }).compile();

  return {
    aggregateCalls,
    committed,
    lockCalls,
    module,
    service: module.get(PoolSeatAllocationService),
  };
}

function totalSeats(members: PoolMemberRecord[]): number {
  return members.reduce((total, member) => total + member.seatCount, 0);
}

describe('PoolSeatAllocationService', () => {
  it('joins a ride to a pool after locking and capacity recalculation', async () => {
    const { aggregateCalls, committed, lockCalls, module, service } =
      await createService();

    await expect(service.joinPool('pool-id', 'ride-id')).resolves.toEqual({
      poolId: 'pool-id',
      rideRequestId: 'ride-id',
      seatCount: 1,
      farePaisa: 5600,
    });

    expect(committed.members).toContainEqual({
      poolId: 'pool-id',
      rideRequestId: 'ride-id',
      seatCount: 1,
      farePaisa: 5600,
    });
    expect(lockCalls[0]?.mock.invocationCallOrder[0]).toBeLessThan(
      aggregateCalls[0]?.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );

    await module.close();
  });

  it('rejects when joining would exceed vehicle capacity', async () => {
    const { committed, module, service } = await createService(
      createInitialState({
        pools: [
          {
            id: 'pool-id',
            vehicleId: 'vehicle-id',
            vehicle: {
              capacity: 1,
            },
          },
        ],
      }),
    );

    await expect(service.joinPool('pool-id', 'ride-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(committed.members).toHaveLength(1);
    expect(totalSeats(committed.members)).toBe(1);

    await module.close();
  });

  it('allows only one concurrent join attempt to claim the last seat', async () => {
    const { committed, module, service } = await createService(
      createInitialState({
        pools: [
          {
            id: 'pool-id',
            vehicleId: 'vehicle-id',
            vehicle: {
              capacity: 2,
            },
          },
        ],
        rides: [
          {
            id: 'ride-1',
            requestedSeats: 1,
            estimatedFarePaisa: 5600,
          },
          {
            id: 'ride-2',
            requestedSeats: 1,
            estimatedFarePaisa: 6200,
          },
        ],
      }),
    );

    const results = await Promise.allSettled([
      service.joinPool('pool-id', 'ride-1'),
      service.joinPool('pool-id', 'ride-2'),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
    expect(committed.members).toHaveLength(2);
    expect(totalSeats(committed.members)).toBe(2);

    await module.close();
  });

  it('rolls back when membership creation fails', async () => {
    const { committed, module, service } = await createService(
      createInitialState(),
      {
        failMembershipCreation: true,
      },
    );

    await expect(service.joinPool('pool-id', 'ride-id')).rejects.toThrow(
      'membership creation failed',
    );

    expect(committed.members).toEqual([
      {
        poolId: 'pool-id',
        rideRequestId: 'existing-ride-id',
        seatCount: 1,
        farePaisa: 6000,
      },
    ]);

    await module.close();
  });
});
