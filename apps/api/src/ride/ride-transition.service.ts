import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RideStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import type { RideResult } from './interfaces/ride-result.interface.js';
import { canTransition } from './state/ride-status-machine.js';

@Injectable()
export class RideTransitionService {
  constructor(private readonly prisma: PrismaService) {}

  async transitionRideStatus(
    rideId: string,
    nextStatus: RideStatus,
    changedBy: string,
  ): Promise<RideResult> {
    return this.prisma.$transaction(async (tx) => {
      const ride = await tx.rideRequest.findUnique({
        where: { id: rideId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!ride) {
        throw new NotFoundException('Ride request not found');
      }

      if (!canTransition(ride.status, nextStatus)) {
        throw new BadRequestException(
          `Invalid ride status transition: ${ride.status} -> ${nextStatus}`,
        );
      }

      const updatedRide = await tx.rideRequest.update({
        where: { id: rideId },
        data: { status: nextStatus },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: rideId,
          previousStatus: ride.status,
          newStatus: nextStatus,
          changedBy,
        },
      });

      return {
        id: updatedRide.id,
        status: updatedRide.status,
      };
    });
  }
}
