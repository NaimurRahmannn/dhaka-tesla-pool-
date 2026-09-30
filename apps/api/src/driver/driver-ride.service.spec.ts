import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RideStatus, VehicleStatus } from '../generated/prisma/client.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { DriverRideService } from './driver-ride.service.js';

type AssignedRideRecord = {
  id: string;
  vehicleDriverId: string | null;
  vehicleStatus?: VehicleStatus;
};

function createService({
  ride,
  transitionError,
}: {
  ride: AssignedRideRecord | null;
  transitionError?: Error;
}) {
  const findUnique = vi.fn(async ({ where }: { where: { id: string } }) => {
    if (!ride || ride.id !== where.id) {
      return null;
    }

    return {
      id: ride.id,
      poolMember: ride.vehicleDriverId
        ? {
            pool: {
              vehicle: {
                driverId: ride.vehicleDriverId,
                status: ride.vehicleStatus ?? VehicleStatus.ONLINE,
              },
            },
          }
        : null,
    };
  });
  const prisma = {
    rideRequest: {
      findUnique,
    },
  } as unknown as PrismaService;
  const rideTransitionService = {
    transitionRideStatus: vi.fn(
      async (
        rideId: string,
        nextStatus: RideStatus,
      ) => {
        if (transitionError) {
          throw transitionError;
        }

        return {
          id: rideId,
          status: nextStatus,
        };
      },
    ),
  } as unknown as RideTransitionService;

  return {
    findUnique,
    rideTransitionService,
    service: new DriverRideService(prisma, rideTransitionService),
  };
}

describe('DriverRideService', () => {
  it('allows a driver to mark an assigned ride as arrived', async () => {
    const { rideTransitionService, service } = createService({
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'jashim-id',
        vehicleStatus: VehicleStatus.ONLINE,
      },
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
    );
  });

  it('rejects ride lifecycle actions when the assigned vehicle is offline', async () => {
    const { rideTransitionService, service } = createService({
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'jashim-id',
        vehicleStatus: VehicleStatus.OFFLINE,
      },
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
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'jashim-id',
      },
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
    const { service } = createService({
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'jashim-id',
      },
    });

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

  it("rejects rides assigned to another driver's vehicle", async () => {
    const { rideTransitionService, service } = createService({
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'other-driver-id',
      },
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
      ride: {
        id: 'ride-id',
        vehicleDriverId: 'jashim-id',
      },
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
      ride: null,
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
