import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RideStatus } from '../generated/prisma/client.js';
import { FareService } from '../fare/fare.service.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { RideService } from './ride.service.js';
import { RideTransitionService } from './ride-transition.service.js';

const ownedRide = {
  id: 'ride-id',
  passengerId: 'passenger-id',
  pickupLat: 23.7937,
  pickupLng: 90.4066,
  destinationLat: 23.8103,
  destinationLng: 90.4125,
  status: RideStatus.REQUESTED,
  requestedSeats: 1,
  estimatedFarePaisa: 2000,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
};

function createModule(prisma: PrismaService, transitionService = {}) {
  return Test.createTestingModule({
    providers: [
      RideService,
      { provide: PrismaService, useValue: prisma },
      { provide: RoutingService, useValue: {} },
      { provide: FareService, useValue: {} },
      { provide: RideTransitionService, useValue: transitionService },
    ],
  }).compile();
}

describe('RideService ownership authorization', () => {
  it('lists only rides owned by the authenticated passenger', async () => {
    const findMany = vi.fn().mockResolvedValue([ownedRide]);
    const module = await createModule({
      rideRequest: { findMany },
    } as unknown as PrismaService);
    const service = module.get(RideService);

    await expect(service.listPassengerRides('passenger-id')).resolves.toEqual([
      ownedRide,
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: { passengerId: 'passenger-id' },
      orderBy: { createdAt: 'desc' },
      include: expect.anything(),
    });

    await module.close();
  });

  it('returns an empty list when the passenger has no rides', async () => {
    const module = await createModule({
      rideRequest: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService);
    const service = module.get(RideService);

    await expect(service.listPassengerRides('passenger-id')).resolves.toEqual(
      [],
    );

    await module.close();
  });

  it('returns an owned ride by id', async () => {
    const findFirst = vi.fn().mockResolvedValue(ownedRide);
    const module = await createModule({
      rideRequest: { findFirst },
    } as unknown as PrismaService);
    const service = module.get(RideService);

    await expect(
      service.getPassengerRide('ride-id', 'passenger-id'),
    ).resolves.toEqual(ownedRide);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'ride-id',
        passengerId: 'passenger-id',
      },
      include: expect.anything(),
    });

    await module.close();
  });

  it('maps pooled ride details and discounted fare when ride is pooled', async () => {
    const pooledPrismaRide = {
      ...ownedRide,
      poolMember: {
        id: 'member-1',
        farePaisa: 1600,
        seatCount: 1,
        pool: {
          id: 'pool-123',
          status: 'ACTIVE',
          vehicle: {
            id: 'veh-1',
            name: 'Bullet Tesla',
            capacity: 3,
          },
          _count: {
            members: 2,
          },
        },
      },
    };

    const findFirst = vi.fn().mockResolvedValue(pooledPrismaRide);
    const module = await createModule({
      rideRequest: { findFirst },
    } as unknown as PrismaService);
    const service = module.get(RideService);

    const result = await service.getPassengerRide('ride-id', 'passenger-id');

    expect(result.poolId).toBe('pool-123');
    expect(result.farePaisa).toBe(1600);
    expect(result.pool).toEqual({
      id: 'pool-123',
      status: 'ACTIVE',
      vehicleName: 'Bullet Tesla',
      capacity: 3,
      memberCount: 2,
    });

    await module.close();
  });

  it('hides another passenger ride as not found', async () => {
    const module = await createModule({
      rideRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService);
    const service = module.get(RideService);

    await expect(
      service.getPassengerRide('other-ride-id', 'passenger-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await module.close();
  });

  it('cancels an owned ride through RideTransitionService', async () => {
    const transitionRideStatus = vi.fn().mockResolvedValue({
      id: 'ride-id',
      status: RideStatus.CANCELLED,
    });
    const module = await createModule(
      {
        rideRequest: {
          findFirst: vi.fn().mockResolvedValue(ownedRide),
        },
      } as unknown as PrismaService,
      { transitionRideStatus },
    );
    const service = module.get(RideService);

    await expect(
      service.cancelPassengerRide('ride-id', 'passenger-id'),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.CANCELLED,
    });

    expect(transitionRideStatus).toHaveBeenCalledWith(
      'ride-id',
      RideStatus.CANCELLED,
      'passenger-id',
    );

    await module.close();
  });

  it('does not cancel another passenger ride', async () => {
    const transitionRideStatus = vi.fn();
    const module = await createModule(
      {
        rideRequest: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService,
      { transitionRideStatus },
    );
    const service = module.get(RideService);

    await expect(
      service.cancelPassengerRide('other-ride-id', 'passenger-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(transitionRideStatus).not.toHaveBeenCalled();

    await module.close();
  });
});
