import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RideStatus } from '../generated/prisma/client.js';
import type { RideResult } from '../ride/interfaces/ride-result.interface.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';

@Injectable()
export class DriverRideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rideTransitionService: RideTransitionService,
  ) {}

  async transitionAssignedRide(
    driverId: string,
    rideId: string,
    nextStatus: RideStatus,
  ): Promise<RideResult> {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        poolMember: {
          select: {
            pool: {
              select: {
                vehicle: {
                  select: {
                    driverId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }

    if (ride.poolMember?.pool.vehicle.driverId !== driverId) {
      throw new ForbiddenException('Ride is not assigned to this driver');
    }

    return this.rideTransitionService.transitionRideStatus(
      ride.id,
      nextStatus,
      driverId,
    );
  }
}
