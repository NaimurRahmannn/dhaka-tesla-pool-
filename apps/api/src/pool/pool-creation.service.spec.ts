import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FareService } from '../fare/fare.service.js';
import { PoolStatus, RideStatus } from '../generated/prisma/client.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { PoolCreationService } from './pool-creation.service.js';

type RideRecord = {
  id: string;
  passengerId: string;
  requestedSeats: number;
  status: RideStatus;
  routeSnapshots: Array<{
    distanceMeter: number;
  }>;
};

type TransactionState = {
  vehicle: {
    id: string;
    capacity: number;
  } | null;
  rides: RideRecord[];
  pools: Array<{
    id: string;
    vehicleId: string;
    status: PoolStatus;
  }>;
  members: Array<{
    poolId: string;
    rideRequestId: string;
    seatCount: number;
    farePaisa: number;
  }>;
  history: Array<Record<string, unknown>>;
};

function createPoolCreationPrismaMock(
  initialState: TransactionState,
  options: { failHistoryCreation?: boolean } = {},
) {
  const committed: TransactionState = structuredClone(initialState);
  const transactionClients: unknown[] = [];

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const staged: TransactionState = structuredClone(committed);

        const transaction = {
          vehicle: {
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
              staged.vehicle?.id === where.id ? staged.vehicle : null,
            ),
          },
          rideRequest: {
            findMany: vi.fn(
              async ({ where }: { where: { id: { in: string[] } } }) =>
                staged.rides.filter((ride) => where.id.in.includes(ride.id)),
            ),
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
              const ride = staged.rides.find(({ id }) => id === where.id);

              return ride
                ? {
                    id: ride.id,
                    status: ride.status,
                  }
                : null;
            }),
            update: vi.fn(
              async ({
                where,
                data,
              }: {
                where: { id: string };
                data: { status: RideStatus };
              }) => {
                const ride = staged.rides.find(({ id }) => id === where.id);

                if (!ride) {
                  throw new Error('ride not found');
                }

                ride.status = data.status;

                return {
                  id: ride.id,
                  status: ride.status,
                };
              },
            ),
          },
          pool: {
            create: vi.fn(
              async ({
                data,
              }: {
                data: { vehicleId: string; status: PoolStatus };
              }) => {
                const pool = {
                  id: 'pool-id',
                  vehicleId: data.vehicleId,
                  status: data.status,
                };

                staged.pools.push(pool);

                return {
                  id: pool.id,
                  status: pool.status,
                };
              },
            ),
          },
          poolMember: {
            create: vi.fn(
              async ({
                data,
              }: {
                data: {
                  poolId: string;
                  rideRequestId: string;
                  seatCount: number;
                  farePaisa: number;
                };
              }) => {
                staged.members.push(data);

                return data;
              },
            ),
          },
          rideStatusHistory: {
            create: vi.fn(
              async ({ data }: { data: Record<string, unknown> }) => {
                if (options.failHistoryCreation) {
                  throw new Error('history creation failed');
                }

                staged.history.push(data);

                return data;
              },
            ),
          },
        };

        transactionClients.push(transaction);

        const result = await callback(transaction);

        committed.vehicle = staged.vehicle;
        committed.rides = staged.rides;
        committed.pools = staged.pools;
        committed.members = staged.members;
        committed.history = staged.history;

        return result;
      },
    ),
  } as unknown as PrismaService;

  return {
    committed,
    prisma,
    transactionClients,
  };
}

function createInitialState(overrides: Partial<TransactionState> = {}) {
  return {
    vehicle: {
      id: 'vehicle-id',
      capacity: 3,
    },
    rides: [
      {
        id: 'ride-1',
        passengerId: 'passenger-1',
        requestedSeats: 1,
        status: RideStatus.REQUESTED,
        routeSnapshots: [{ distanceMeter: 10000 }],
      },
      {
        id: 'ride-2',
        passengerId: 'passenger-2',
        requestedSeats: 1,
        status: RideStatus.REQUESTED,
        routeSnapshots: [{ distanceMeter: 12000 }],
      },
    ],
    pools: [],
    members: [],
    history: [],
    ...overrides,
  };
}

async function createService({
  initialState = createInitialState(),
  failHistoryCreation = false,
}: {
  initialState?: TransactionState;
  failHistoryCreation?: boolean;
} = {}) {
  const { committed, prisma, transactionClients } = createPoolCreationPrismaMock(
    initialState,
    { failHistoryCreation },
  );
  const fareService = {
    calculateFare: vi.fn(({ distanceMeter }: { distanceMeter: number }) => ({
      baseFarePaisa: 2000,
      distanceChargePaisa: distanceMeter,
      subtotalPaisa: 2000 + distanceMeter,
      poolDiscountPaisa: 400,
      finalFarePaisa: distanceMeter + 1600,
    })),
  } as unknown as FareService;
  const module = await Test.createTestingModule({
    providers: [
      PoolCreationService,
      RideTransitionService,
      {
        provide: PrismaService,
        useValue: prisma,
      },
      {
        provide: FareService,
        useValue: fareService,
      },
    ],
  }).compile();
  const transitionService = module.get(RideTransitionService);
  const transitionSpy = vi.spyOn(transitionService, 'transitionRideStatus');

  return {
    committed,
    fareService,
    module,
    service: module.get(PoolCreationService),
    transitionSpy,
    transactionClients,
  };
}

describe('PoolCreationService', () => {
  it('creates a pool, members, and transitions rides to MATCHED', async () => {
    const { committed, module, service, transitionSpy } = await createService();

    await expect(
      service.createPool('vehicle-id', ['ride-1', 'ride-2']),
    ).resolves.toEqual({
      id: 'pool-id',
      status: PoolStatus.MATCHING,
    });

    expect(committed.pools).toEqual([
      {
        id: 'pool-id',
        vehicleId: 'vehicle-id',
        status: PoolStatus.MATCHING,
      },
    ]);
    expect(committed.members).toEqual([
      {
        poolId: 'pool-id',
        rideRequestId: 'ride-1',
        seatCount: 1,
        farePaisa: 11600,
      },
      {
        poolId: 'pool-id',
        rideRequestId: 'ride-2',
        seatCount: 1,
        farePaisa: 13600,
      },
    ]);
    expect(committed.rides.map(({ status }) => status)).toEqual([
      RideStatus.MATCHED,
      RideStatus.MATCHED,
    ]);
    expect(transitionSpy).toHaveBeenCalledTimes(2);

    await module.close();
  });

  it('calculates each member fare as pooled', async () => {
    const { fareService, module, service } = await createService();

    await service.createPool('vehicle-id', ['ride-1', 'ride-2']);

    expect(fareService.calculateFare).toHaveBeenCalledWith({
      distanceMeter: 10000,
      isPooled: true,
    });
    expect(fareService.calculateFare).toHaveBeenCalledWith({
      distanceMeter: 12000,
      isPooled: true,
    });

    await module.close();
  });

  it('rejects when requested seats exceed vehicle capacity', async () => {
    const { committed, module, service } = await createService({
      initialState: createInitialState({
        vehicle: {
          id: 'vehicle-id',
          capacity: 1,
        },
      }),
    });

    await expect(
      service.createPool('vehicle-id', ['ride-1', 'ride-2']),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(committed.pools).toHaveLength(0);
    expect(committed.members).toHaveLength(0);
    expect(committed.rides.map(({ status }) => status)).toEqual([
      RideStatus.REQUESTED,
      RideStatus.REQUESTED,
    ]);

    await module.close();
  });

  it('rejects rides that are not REQUESTED', async () => {
    const { committed, module, service } = await createService({
      initialState: createInitialState({
        rides: [
          {
            id: 'ride-1',
            passengerId: 'passenger-1',
            requestedSeats: 1,
            status: RideStatus.MATCHED,
            routeSnapshots: [{ distanceMeter: 10000 }],
          },
        ],
      }),
    });

    await expect(
      service.createPool('vehicle-id', ['ride-1']),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(committed.pools).toHaveLength(0);
    expect(committed.members).toHaveLength(0);
    expect(committed.rides[0]?.status).toBe(RideStatus.MATCHED);

    await module.close();
  });

  it('rolls back pool creation when a status history write fails', async () => {
    const { committed, module, service } = await createService({
      failHistoryCreation: true,
    });

    await expect(
      service.createPool('vehicle-id', ['ride-1', 'ride-2']),
    ).rejects.toThrow('history creation failed');

    expect(committed.pools).toHaveLength(0);
    expect(committed.members).toHaveLength(0);
    expect(committed.history).toHaveLength(0);
    expect(committed.rides.map(({ status }) => status)).toEqual([
      RideStatus.REQUESTED,
      RideStatus.REQUESTED,
    ]);

    await module.close();
  });

  it('rejects a missing vehicle before creating records', async () => {
    const { committed, module, service } = await createService({
      initialState: createInitialState({
        vehicle: null,
      }),
    });

    await expect(
      service.createPool('missing-vehicle-id', ['ride-1']),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(committed.pools).toHaveLength(0);
    expect(committed.members).toHaveLength(0);

    await module.close();
  });
});
