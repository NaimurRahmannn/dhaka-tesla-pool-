import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PoolStatus,
  RideStatus,
  VehicleStatus,
} from '../generated/prisma/client.js';
import { PoolTransitionService } from '../pool/pool-transition.service.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { DriverRideService } from './driver-ride.service.js';

type AssignedRideRecord = {
  id: string;
  poolId?: string;
  status: RideStatus;
  vehicleDriverId: string | null;
  vehicleStatus?: VehicleStatus;
};

type DriverRideState = {
  pool: {
    id: string;
    status: PoolStatus;
  };
  rides: AssignedRideRecord[];
};

function createDefaultState(
  overrides: Partial<DriverRideState> = {},
): DriverRideState {
  return {
    pool: {
      id: 'pool-id',
      status: PoolStatus.ACTIVE,
    },
    rides: [
      {
        id: 'ride-id',
        poolId: 'pool-id',
        status: RideStatus.STARTED,
        vehicleDriverId: 'jashim-id',
        vehicleStatus: VehicleStatus.ONLINE,
      },
    ],
    ...overrides,
  };
}

function createService({
  initialState = createDefaultState(),
  poolTransitionError,
  transitionError,
}: {
  initialState?: DriverRideState;
  poolTransitionError?: Error;
  transitionError?: Error;
} = {}) {
  const committed: DriverRideState = structuredClone(initialState);
  const transactionState = new WeakMap<object, DriverRideState>();

  const createTransaction = (staged: DriverRideState) => ({
    rideRequest: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const ride = staged.rides.find(({ id }) => id === where.id);

        if (!ride) {
          return null;
        }

        return {
          id: ride.id,
          poolMember:
            ride.vehicleDriverId && ride.poolId
              ? {
                  pool: {
                    id: ride.poolId,
                    vehicle: {
                      driverId: ride.vehicleDriverId,
                      status: ride.vehicleStatus ?? VehicleStatus.ONLINE,
                    },
                  },
                }
              : null,
        };
      }),
    },
    pool: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (staged.pool.id !== where.id) {
          return null;
        }

        return {
          id: staged.pool.id,
          status: staged.pool.status,
          members: staged.rides
            .filter(({ poolId }) => poolId === where.id)
            .map((ride) => ({
              rideRequest: {
                status: ride.status,
              },
            })),
        };
      }),
    },
  });

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const staged = structuredClone(committed);
        const transaction = createTransaction(staged);

        transactionState.set(transaction, staged);

        const result = await callback(transaction);

        committed.pool = staged.pool;
        committed.rides = staged.rides;

        return result;
      },
    ),
  } as unknown as PrismaService;
  const rideTransitionService = {
    transitionRideStatus: vi.fn(
      async (
        rideId: string,
        nextStatus: RideStatus,
        _changedBy: string,
        tx?: unknown,
      ) => {
        if (transitionError) {
          throw transitionError;
        }

        const state =
          tx && typeof tx === 'object'
            ? transactionState.get(tx)
            : committed;
        const ride = state?.rides.find(({ id }) => id === rideId);

        if (ride) {
          ride.status = nextStatus;
        }

        return {
          id: rideId,
          status: nextStatus,
        };
      },
    ),
  } as unknown as RideTransitionService;
  const poolTransitionService = {
    transitionPoolStatus: vi.fn(
      async (
        poolId: string,
        nextStatus: PoolStatus,
        tx?: unknown,
      ) => {
        if (poolTransitionError) {
          throw poolTransitionError;
        }

        const state =
          tx && typeof tx === 'object'
            ? transactionState.get(tx)
            : committed;

        if (state?.pool.id === poolId) {
          state.pool.status = nextStatus;
        }

        return {
          id: poolId,
          status: nextStatus,
        };
      },
    ),
  } as unknown as PoolTransitionService;

  return {
    committed,
    poolTransitionService,
    rideTransitionService,
    service: new DriverRideService(
      prisma,
      rideTransitionService,
      poolTransitionService,
    ),
  };
}

describe('DriverRideService', () => {
  it('allows a driver to mark an assigned ride as arrived', async () => {
    const { rideTransitionService, service } = createService({
      initialState: createDefaultState({
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.MATCHED,
            vehicleDriverId: 'jashim-id',
            vehicleStatus: VehicleStatus.ONLINE,
          },
        ],
      }),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.DRIVER_ARRIVED,
      ),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.DRIVER_ARRIVED,
    });
    expect(rideTransitionService.transitionRideStatus).toHaveBeenCalledWith(
      'ride-id',
      RideStatus.DRIVER_ARRIVED,
      'jashim-id',
      expect.any(Object),
    );
  });

  it('rejects ride lifecycle actions when the assigned vehicle is offline', async () => {
    const { rideTransitionService, service } = createService({
      initialState: createDefaultState({
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.MATCHED,
            vehicleDriverId: 'jashim-id',
            vehicleStatus: VehicleStatus.OFFLINE,
          },
        ],
      }),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.DRIVER_ARRIVED,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rideTransitionService.transitionRideStatus).not.toHaveBeenCalled();
  });

  it('allows a driver to start an assigned ride', async () => {
    const { service } = createService({
      initialState: createDefaultState({
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.DRIVER_ARRIVED,
            vehicleDriverId: 'jashim-id',
          },
        ],
      }),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.STARTED,
      ),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.STARTED,
    });
  });

  it('allows a driver to complete an assigned ride', async () => {
    const { service } = createService();

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.COMPLETED,
      ),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.COMPLETED,
    });
  });

  it('completes the active pool when the last assigned ride completes', async () => {
    const { committed, poolTransitionService, service } = createService({
      initialState: createDefaultState({
        pool: {
          id: 'pool-id',
          status: PoolStatus.ACTIVE,
        },
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.STARTED,
            vehicleDriverId: 'jashim-id',
          },
          {
            id: 'other-ride-id',
            poolId: 'pool-id',
            status: RideStatus.COMPLETED,
            vehicleDriverId: 'jashim-id',
          },
        ],
      }),
    });

    await service.transitionAssignedRide(
      'jashim-id',
      'ride-id',
      RideStatus.COMPLETED,
    );

    expect(committed.rides[0]?.status).toBe(RideStatus.COMPLETED);
    expect(committed.pool.status).toBe(PoolStatus.COMPLETED);
    expect(poolTransitionService.transitionPoolStatus).toHaveBeenCalledWith(
      'pool-id',
      PoolStatus.COMPLETED,
      expect.any(Object),
    );
  });

  it('keeps the active pool open when another assigned ride is unfinished', async () => {
    const { committed, poolTransitionService, service } = createService({
      initialState: createDefaultState({
        pool: {
          id: 'pool-id',
          status: PoolStatus.ACTIVE,
        },
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.STARTED,
            vehicleDriverId: 'jashim-id',
          },
          {
            id: 'other-ride-id',
            poolId: 'pool-id',
            status: RideStatus.STARTED,
            vehicleDriverId: 'jashim-id',
          },
        ],
      }),
    });

    await service.transitionAssignedRide(
      'jashim-id',
      'ride-id',
      RideStatus.COMPLETED,
    );

    expect(committed.rides[0]?.status).toBe(RideStatus.COMPLETED);
    expect(committed.pool.status).toBe(PoolStatus.ACTIVE);
    expect(poolTransitionService.transitionPoolStatus).not.toHaveBeenCalled();
  });

  it('rolls back ride completion when pool completion fails', async () => {
    const { committed, service } = createService({
      initialState: createDefaultState({
        pool: {
          id: 'pool-id',
          status: PoolStatus.ACTIVE,
        },
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.STARTED,
            vehicleDriverId: 'jashim-id',
          },
          {
            id: 'other-ride-id',
            poolId: 'pool-id',
            status: RideStatus.COMPLETED,
            vehicleDriverId: 'jashim-id',
          },
        ],
      }),
      poolTransitionError: new Error('pool transition failed'),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.COMPLETED,
      ),
    ).rejects.toThrow('pool transition failed');

    expect(committed.rides[0]?.status).toBe(RideStatus.STARTED);
    expect(committed.pool.status).toBe(PoolStatus.ACTIVE);
  });

  it("rejects rides assigned to another driver's vehicle", async () => {
    const { rideTransitionService, service } = createService({
      initialState: createDefaultState({
        rides: [
          {
            id: 'ride-id',
            poolId: 'pool-id',
            status: RideStatus.MATCHED,
            vehicleDriverId: 'other-driver-id',
          },
        ],
      }),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.DRIVER_ARRIVED,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(rideTransitionService.transitionRideStatus).not.toHaveBeenCalled();
  });

  it('passes invalid lifecycle transitions through from RideTransitionService', async () => {
    const { service } = createService({
      transitionError: new BadRequestException(
        'Invalid ride status transition: COMPLETED -> STARTED',
      ),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'ride-id',
        RideStatus.STARTED,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing rides', async () => {
    const { service } = createService({
      initialState: createDefaultState({
        rides: [],
      }),
    });

    await expect(
      service.transitionAssignedRide(
        'jashim-id',
        'missing-ride-id',
        RideStatus.DRIVER_ARRIVED,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
