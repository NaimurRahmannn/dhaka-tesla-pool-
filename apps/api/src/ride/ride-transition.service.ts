import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RideStatus } from '../generated/prisma/client.js';
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
    transactionClient?: Prisma.TransactionClient,
  ): Promise<RideResult> {
    if (transactionClient) {
      return this.transitionRideStatusWithClient(
        transactionClient,
        rideId,
        nextStatus,
        changedBy,
      );
    }

    return this.prisma.$transaction((tx) =>
      this.transitionRideStatusWithClient(tx, rideId, nextStatus, changedBy),
    );
  }

  private async transitionRideStatusWithClient(
    tx: Prisma.TransactionClient,
    rideId: string,
    nextStatus: RideStatus,
    changedBy: string,
  ): Promise<RideResult> {
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
  }
}
