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
import { PoolCreationService } from '../pool/pool-creation.service.js';
import { PoolSeatAllocationService } from '../pool/pool-seat-allocation.service.js';
import { PoolTransitionService } from '../pool/pool-transition.service.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';
import {
  calculateHaversineDistanceMeter,
  DriverRideService,
} from './driver-ride.service.js';

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
                    status: staged.pool.status,
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
    rideRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicle: {
      findFirst: vi.fn(),
    },
    pool: {
      findFirst: vi.fn(),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (committed.pool.id !== where.id) {
          return null;
        }

        return {
          id: committed.pool.id,
          status: committed.pool.status,
          members: committed.rides
            .filter(({ poolId }) => poolId === where.id)
            .map((ride) => ({
              rideRequest: {
                status: ride.status,
              },
            })),
        };
      }),
    },
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
  const poolCreationService = {
    createPool: vi.fn(),
  } as unknown as PoolCreationService;
  const poolSeatAllocationService = {
    joinPool: vi.fn(),
  } as unknown as PoolSeatAllocationService;

  return {
    committed,
    prisma,
    poolTransitionService,
    rideTransitionService,
    poolCreationService,
    poolSeatAllocationService,
    service: new DriverRideService(
      prisma,
      rideTransitionService,
      poolTransitionService,
      poolCreationService,
      poolSeatAllocationService,
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

  it('activates a matching pool when the driver starts an assigned ride', async () => {
    const { committed, poolTransitionService, service } = createService({
      initialState: createDefaultState({
        pool: {
          id: 'pool-id',
          status: PoolStatus.MATCHING,
        },
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

    expect(committed.pool.status).toBe(PoolStatus.ACTIVE);
    expect(poolTransitionService.transitionPoolStatus).toHaveBeenCalledWith(
      'pool-id',
      PoolStatus.ACTIVE,
      expect.any(Object),
    );
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

  it('closes a stale matching pool when all assigned rides are completed', async () => {
    const { committed, poolTransitionService, service } = createService({
      initialState: createDefaultState({
        pool: {
          id: 'pool-id',
          status: PoolStatus.MATCHING,
        },
        rides: [
          {
            id: 'ride-id',
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
    expect(committed.pool.status).toBe(PoolStatus.COMPLETED);
    expect(poolTransitionService.transitionPoolStatus).toHaveBeenNthCalledWith(
      1,
      'pool-id',
      PoolStatus.ACTIVE,
      expect.any(Object),
    );
    expect(poolTransitionService.transitionPoolStatus).toHaveBeenNthCalledWith(
      2,
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

  describe('calculateHaversineDistanceMeter', () => {
    it('calculates accurate distance in meters between Dhaka coordinates', () => {
      // Old Dhaka (Lalbagh) to Banani (Road 11) is approx 8.4 km
      const oldDhakaLat = 23.7196;
      const oldDhakaLng = 90.3881;
      const bananiLat = 23.7937;
      const bananiLng = 90.4043;

      const distanceToBanani = calculateHaversineDistanceMeter(
        oldDhakaLat,
        oldDhakaLng,
        bananiLat,
        bananiLng,
      );

      // Distance should exceed 8 km and exceed 3 km threshold
      expect(distanceToBanani).toBeGreaterThan(8000);
      expect(distanceToBanani).toBeLessThan(9000);

      // Banani to Gulshan 2 is ~400 meters
      const gulshanLat = 23.7925;
      const gulshanLng = 90.4078;
      const distanceToGulshan = calculateHaversineDistanceMeter(
        bananiLat,
        bananiLng,
        gulshanLat,
        gulshanLng,
      );

      expect(distanceToGulshan).toBeLessThan(500);
      expect(distanceToGulshan).toBeGreaterThan(300);
    });
  });

  describe('getNearbyRides', () => {
    it('filters rides by distance radius and sorts closest first', async () => {
      const { service, prisma } = createService();

      vi.mocked(prisma.rideRequest.findMany).mockResolvedValue([
        {
          id: 'ride-far',
          passengerId: 'p-1',
          passenger: { name: 'Far Passenger' },
          pickupLat: 23.7196, // Old Dhaka
          pickupLng: 90.3881,
          destinationLat: 23.733,
          destinationLng: 90.4172,
          status: RideStatus.REQUESTED,
          requestedSeats: 1,
          estimatedFarePaisa: 50000,
          createdAt: new Date(),
        },
        {
          id: 'ride-near',
          passengerId: 'p-2',
          passenger: { name: 'Near Passenger' },
          pickupLat: 23.7925, // Gulshan (~400m from Banani)
          pickupLng: 90.4078,
          destinationLat: 23.733,
          destinationLng: 90.4172,
          status: RideStatus.REQUESTED,
          requestedSeats: 1,
          estimatedFarePaisa: 35000,
          createdAt: new Date(),
        },
      ]);

      // Driver is in Banani
      const bananiLat = 23.7937;
      const bananiLng = 90.4043;

      const nearby = await service.getNearbyRides('driver-id', bananiLat, bananiLng, 3000);

      // Far ride in Old Dhaka should be filtered out! Only near ride in Gulshan should remain
      expect(nearby).toHaveLength(1);
      expect(nearby[0].id).toBe('ride-near');
      expect(nearby[0].distanceMeter).toBeLessThan(500);
    });
  });

  describe('getCompletedRides', () => {
    it('returns completed rides for the authenticated driver', async () => {
      const { service, prisma } = createService();
      const completedAt = new Date();

      vi.mocked(prisma.rideRequest.findMany).mockResolvedValue([
        {
          id: 'completed-ride',
          passengerId: 'p-1',
          passenger: { name: 'Nusrat' },
          pickupLat: 23.7937,
          pickupLng: 90.4043,
          destinationLat: 23.733,
          destinationLng: 90.4172,
          status: RideStatus.COMPLETED,
          requestedSeats: 1,
          estimatedFarePaisa: 35000,
          createdAt: completedAt,
          poolMember: {
            poolId: 'pool-id',
            farePaisa: 30000,
          },
        },
      ]);

      await expect(service.getCompletedRides('driver-id')).resolves.toEqual([
        {
          id: 'completed-ride',
          passengerId: 'p-1',
          passengerName: 'Nusrat',
          pickupLat: 23.7937,
          pickupLng: 90.4043,
          destinationLat: 23.733,
          destinationLng: 90.4172,
          status: RideStatus.COMPLETED,
          requestedSeats: 1,
          farePaisa: 30000,
          poolId: 'pool-id',
          createdAt: completedAt,
        },
      ]);
      expect(prisma.rideRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RideStatus.COMPLETED,
          }),
        }),
      );
    });
  });

  describe('acceptRide and autoAssignClosestRide', () => {
    it('creates a new pool if no active pool exists when accepting a ride', async () => {
      const { service, prisma, poolCreationService } = createService();

      vi.mocked(prisma.rideRequest.findUnique).mockResolvedValue({
        id: 'ride-1',
        passengerId: 'p-1',
        status: RideStatus.REQUESTED,
        requestedSeats: 1,
        poolMember: null,
      });

      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue({
        id: 'vehicle-1',
        driverId: 'driver-1',
        status: VehicleStatus.ONLINE,
      });

      vi.mocked(prisma.pool.findFirst).mockResolvedValue(null);

      const result = await service.acceptRide('driver-1', 'ride-1');

      expect(result).toEqual({ id: 'ride-1', status: RideStatus.MATCHED });
      expect(poolCreationService.createPool).toHaveBeenCalledWith('vehicle-1', ['ride-1']);
    });

    it('closes a stale completed pool before accepting a new ride', async () => {
      const {
        service,
        prisma,
        poolCreationService,
        poolTransitionService,
      } = createService({
        initialState: createDefaultState({
          pool: {
            id: 'pool-id',
            status: PoolStatus.MATCHING,
          },
          rides: [
            {
              id: 'old-ride',
              poolId: 'pool-id',
              status: RideStatus.COMPLETED,
              vehicleDriverId: 'driver-1',
            },
          ],
        }),
      });

      vi.mocked(prisma.rideRequest.findUnique).mockResolvedValue({
        id: 'ride-1',
        passengerId: 'p-1',
        status: RideStatus.REQUESTED,
        requestedSeats: 1,
        poolMember: null,
      });

      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue({
        id: 'vehicle-1',
        driverId: 'driver-1',
        status: VehicleStatus.ONLINE,
      });

      vi.mocked(prisma.pool.findFirst).mockResolvedValue({
        id: 'pool-id',
        vehicleId: 'vehicle-1',
        status: PoolStatus.MATCHING,
      });

      const result = await service.acceptRide('driver-1', 'ride-1');

      expect(result).toEqual({ id: 'ride-1', status: RideStatus.MATCHED });
      expect(poolTransitionService.transitionPoolStatus).toHaveBeenNthCalledWith(
        1,
        'pool-id',
        PoolStatus.ACTIVE,
      );
      expect(poolTransitionService.transitionPoolStatus).toHaveBeenNthCalledWith(
        2,
        'pool-id',
        PoolStatus.COMPLETED,
      );
      expect(poolCreationService.createPool).toHaveBeenCalledWith('vehicle-1', ['ride-1']);
    });

    it('auto-assigns closest available ride within pickup radius', async () => {
      const { service } = createService();
      const getNearbySpy = vi.spyOn(service, 'getNearbyRides').mockResolvedValue([
        {
          id: 'closest-ride',
          passengerId: 'p-1',
          passengerName: 'Passenger 1',
          pickupLat: 23.7925,
          pickupLng: 90.4078,
          destinationLat: 23.733,
          destinationLng: 90.4172,
          status: RideStatus.REQUESTED,
          requestedSeats: 1,
          estimatedFarePaisa: 35000,
          distanceMeter: 380,
          createdAt: new Date(),
        },
      ]);
      const acceptSpy = vi.spyOn(service, 'acceptRide').mockResolvedValue({
        id: 'closest-ride',
        status: RideStatus.MATCHED,
      });

      const result = await service.autoAssignClosestRide('driver-1', 23.7937, 90.4043, 3000);

      expect(result).toEqual({
        id: 'closest-ride',
        status: RideStatus.MATCHED,
        distanceMeter: 380,
      });
      expect(getNearbySpy).toHaveBeenCalledWith('driver-1', 23.7937, 90.4043, 3000);
      expect(acceptSpy).toHaveBeenCalledWith('driver-1', 'closest-ride');
    });

    it('throws NotFoundException if no nearby rides are available for auto-assign', async () => {
      const { service } = createService();
      vi.spyOn(service, 'getNearbyRides').mockResolvedValue([]);

      await expect(
        service.autoAssignClosestRide('driver-1', 23.7196, 90.3881, 3000),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
