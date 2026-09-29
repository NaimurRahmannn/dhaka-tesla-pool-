import { Injectable, NotFoundException } from '@nestjs/common';
import { CalculateFareDto } from '../fare/dto/calculate-fare.dto.js';
import { FareService } from '../fare/fare.service.js';
import { Prisma, RideStatus } from '../generated/prisma/client.js';
import type { RideRequest } from '../generated/prisma/client.js';
import { RouteRequestDto } from '../routing/dto/route-request.dto.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { CreateRideRequestDto } from './dto/create-ride-request.dto.js';
import type { RideResult } from './interfaces/ride-result.interface.js';
import { RideTransitionService } from './ride-transition.service.js';

@Injectable()
export class RideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: RoutingService,
    private readonly fareService: FareService,
    private readonly rideTransitionService: RideTransitionService,
  ) {}

  async createRideRequest(
    dto: CreateRideRequestDto,
    passengerId: string,
  ): Promise<RideResult> {
    const route = await this.routingService.getRoute(
      new RouteRequestDto(
        dto.pickupLat,
        dto.pickupLng,
        dto.destinationLat,
        dto.destinationLng,
      ),
    );
    const fare = this.fareService.calculateFare(
      new CalculateFareDto(route.distanceMeter, false),
    );

    return this.prisma.$transaction(async (tx) => {
      const rideRequest = await tx.rideRequest.create({
        data: {
          passengerId,
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          destinationLat: dto.destinationLat,
          destinationLng: dto.destinationLng,
          status: RideStatus.REQUESTED,
          estimatedFarePaisa: fare.finalFarePaisa,
        },
      });

      await tx.routeSnapshot.create({
        data: {
          rideRequestId: rideRequest.id,
          distanceMeter: route.distanceMeter,
          durationSecond: route.durationSecond,
          geometry: route.geometry as Prisma.InputJsonValue,
        },
      });

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: rideRequest.id,
          previousStatus: null,
          newStatus: RideStatus.REQUESTED,
          changedBy: passengerId,
        },
      });

      return {
        id: rideRequest.id,
        status: rideRequest.status,
      };
    });
  }

  listPassengerRides(passengerId: string): Promise<RideRequest[]> {
    return this.prisma.rideRequest.findMany({
      where: { passengerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPassengerRide(
    rideId: string,
    passengerId: string,
  ): Promise<RideRequest> {
    const ride = await this.prisma.rideRequest.findFirst({
      where: {
        id: rideId,
        passengerId,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }

    return ride;
  }

  async cancelPassengerRide(
    rideId: string,
    passengerId: string,
  ): Promise<RideResult> {
    await this.getPassengerRide(rideId, passengerId);

    return this.rideTransitionService.transitionRideStatus(
      rideId,
      RideStatus.CANCELLED,
      passengerId,
    );
  }
}
