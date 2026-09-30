import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PoolStatus,
  Prisma,
  RideStatus,
  VehicleStatus,
} from '../generated/prisma/client.js';
import { PoolTransitionService } from '../pool/pool-transition.service.js';
import type { RideResult } from '../ride/interfaces/ride-result.interface.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';

@Injectable()
export class DriverRideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rideTransitionService: RideTransitionService,
    private readonly poolTransitionService: PoolTransitionService,
  ) {}

  async transitionAssignedRide(
    driverId: string,
    rideId: string,
    nextStatus: RideStatus,
  ): Promise<RideResult> {
    return this.prisma.$transaction(async (tx) => {
      const ride = await tx.rideRequest.findUnique({
        where: { id: rideId },
        select: {
          id: true,
          poolMember: {
            select: {
              pool: {
                select: {
                  id: true,
                  vehicle: {
                    select: {
                      driverId: true,
                      status: true,
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

      if (ride.poolMember.pool.vehicle.status !== VehicleStatus.ONLINE) {
        throw new BadRequestException('Vehicle must be online for ride actions');
      }

      const result = await this.rideTransitionService.transitionRideStatus(
        ride.id,
        nextStatus,
        driverId,
        tx,
      );

      if (nextStatus === RideStatus.COMPLETED) {
        await this.completePoolIfAllAssignedRidesCompleted(
          tx,
          ride.poolMember.pool.id,
        );
      }

      return result;
    });
  }

  private async completePoolIfAllAssignedRidesCompleted(
    tx: Prisma.TransactionClient,
    poolId: string,
  ): Promise<void> {
    const pool = await tx.pool.findUnique({
      where: { id: poolId },
      select: {
        id: true,
        status: true,
        members: {
          select: {
            rideRequest: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!pool || pool.status !== PoolStatus.ACTIVE) {
      return;
    }

    const allAssignedRidesCompleted = pool.members.every(
      (member) => member.rideRequest.status === RideStatus.COMPLETED,
    );

    if (!allAssignedRidesCompleted) {
      return;
    }

    await this.poolTransitionService.transitionPoolStatus(
      pool.id,
      PoolStatus.COMPLETED,
      tx,
    );
  }
}
