import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CalculateFareDto } from '../fare/dto/calculate-fare.dto.js';
import { FareService } from '../fare/fare.service.js';
import { PoolStatus, RideStatus } from '../generated/prisma/client.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';

export interface PoolCreationResult {
  id: string;
  status: PoolStatus;
}

@Injectable()
export class PoolCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fareService: FareService,
    private readonly rideTransitionService: RideTransitionService,
  ) {}

  async createPool(
    vehicleId: string,
    rideRequestIds: string[],
  ): Promise<PoolCreationResult> {
    if (rideRequestIds.length === 0) {
      throw new BadRequestException('At least one ride request is required');
    }

    if (new Set(rideRequestIds).size !== rideRequestIds.length) {
      throw new BadRequestException('Ride request ids must be unique');
    }

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: {
          id: true,
          capacity: true,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      const rides = await tx.rideRequest.findMany({
        where: {
          id: {
            in: rideRequestIds,
          },
        },
        select: {
          id: true,
          passengerId: true,
          requestedSeats: true,
          status: true,
          routeSnapshots: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              distanceMeter: true,
            },
            take: 1,
          },
        },
      });

      if (rides.length !== rideRequestIds.length) {
        throw new NotFoundException('Ride request not found');
      }

      const totalRequestedSeats = rides.reduce(
        (total, ride) => total + ride.requestedSeats,
        0,
      );

      if (totalRequestedSeats > vehicle.capacity) {
        throw new BadRequestException('Pool capacity exceeded');
      }

      for (const ride of rides) {
        if (ride.status !== RideStatus.REQUESTED) {
          throw new BadRequestException(
            `Ride request ${ride.id} is not eligible for pooling`,
          );
        }

        if (ride.routeSnapshots.length === 0) {
          throw new BadRequestException(
            `Ride request ${ride.id} has no route snapshot`,
          );
        }
      }

      const pool = await tx.pool.create({
        data: {
          vehicleId,
          status: PoolStatus.MATCHING,
        },
        select: {
          id: true,
          status: true,
        },
      });

      for (const ride of rides) {
        const latestRoute = ride.routeSnapshots[0];

        if (!latestRoute) {
          throw new BadRequestException(
            `Ride request ${ride.id} has no route snapshot`,
          );
        }

        const pooledFare = this.fareService.calculateFare(
          new CalculateFareDto(latestRoute.distanceMeter, true),
        );

        await tx.poolMember.create({
          data: {
            poolId: pool.id,
            rideRequestId: ride.id,
            seatCount: ride.requestedSeats,
            farePaisa: pooledFare.finalFarePaisa,
          },
        });

        await this.rideTransitionService.transitionRideStatus(
          ride.id,
          RideStatus.MATCHED,
          ride.passengerId,
          tx,
        );
      }

      return pool;
    });
  }
}
