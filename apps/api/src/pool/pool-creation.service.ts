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
import { RouteCorridorMatcher } from './matching/route-corridor-matcher.js';
import type { RouteCandidate } from './matching/route-corridor.types.js';

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
    private readonly routeCorridorMatcher: RouteCorridorMatcher,
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
          pickupLat: true,
          pickupLng: true,
          destinationLat: true,
          destinationLng: true,
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

      this.assertRidesAreRouteCompatible(rides);

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

  private assertRidesAreRouteCompatible(
    rides: Array<{
      id: string;
      pickupLat: unknown;
      pickupLng: unknown;
      destinationLat: unknown;
      destinationLng: unknown;
      routeSnapshots: Array<{ distanceMeter: number }>;
    }>,
  ): void {
    for (let index = 0; index < rides.length; index += 1) {
      const existingRide = rides[index];

      if (!existingRide) {
        continue;
      }

      for (
        let candidateIndex = index + 1;
        candidateIndex < rides.length;
        candidateIndex += 1
      ) {
        const candidateRide = rides[candidateIndex];

        if (!candidateRide) {
          continue;
        }

        const existingRoute = toRouteCandidate(existingRide);
        const candidateRoute = toRouteCandidate(candidateRide);
        const sharedRouteDistanceMeter = Math.max(
          existingRoute.distanceMeter,
          candidateRoute.distanceMeter,
        );
        const match = this.routeCorridorMatcher.match(
          existingRoute,
          candidateRoute,
          sharedRouteDistanceMeter,
        );

        if (!match.compatible) {
          throw new BadRequestException('Ride requests are not pool compatible');
        }
      }
    }
  }
}

function toRouteCandidate(ride: {
  pickupLat: unknown;
  pickupLng: unknown;
  destinationLat: unknown;
  destinationLng: unknown;
  routeSnapshots: Array<{ distanceMeter: number }>;
}): RouteCandidate {
  const latestRoute = ride.routeSnapshots[0];

  if (!latestRoute) {
    throw new BadRequestException('Ride request has no route snapshot');
  }

  return {
    pickupLat: Number(ride.pickupLat),
    pickupLng: Number(ride.pickupLng),
    destinationLat: Number(ride.destinationLat),
    destinationLng: Number(ride.destinationLng),
    distanceMeter: latestRoute.distanceMeter,
  };
}
