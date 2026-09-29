import { Injectable } from '@nestjs/common';
import { CalculateFareDto } from '../fare/dto/calculate-fare.dto.js';
import { FareService } from '../fare/fare.service.js';
import { Prisma, RideStatus } from '../generated/prisma/client.js';
import { RouteRequestDto } from '../routing/dto/route-request.dto.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { CreateRideRequestDto } from './dto/create-ride-request.dto.js';
import type { RideResult } from './interfaces/ride-result.interface.js';

@Injectable()
export class RideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: RoutingService,
    private readonly fareService: FareService,
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
}
