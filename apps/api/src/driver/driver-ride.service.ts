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
import { PoolCreationService } from '../pool/pool-creation.service.js';
import { PoolSeatAllocationService } from '../pool/pool-seat-allocation.service.js';
import { PoolTransitionService } from '../pool/pool-transition.service.js';
import type { RideResult } from '../ride/interfaces/ride-result.interface.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';

export interface AssignedDriverRide {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: RideStatus;
  requestedSeats: number;
  farePaisa: number;
  poolId: string;
  createdAt: Date;
}

export interface NearbyDriverRide {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: RideStatus;
  requestedSeats: number;
  estimatedFarePaisa: number | null;
  distanceMeter: number;
  createdAt: Date;
}

export function calculateHaversineDistanceMeter(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const EARTH_RADIUS_METER = 6371000;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadian = toRadians(firstLatitude);
  const secondLatitudeRadian = toRadians(secondLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadian) *
      Math.cos(secondLatitudeRadian) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    2 *
      EARTH_RADIUS_METER *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

@Injectable()
export class DriverRideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rideTransitionService: RideTransitionService,
    private readonly poolTransitionService: PoolTransitionService,
    private readonly poolCreationService: PoolCreationService,
    private readonly poolSeatAllocationService: PoolSeatAllocationService,
  ) {}

  async getAssignedRides(driverId: string): Promise<AssignedDriverRide[]> {
    const rides = await this.prisma.rideRequest.findMany({
      where: {
        poolMember: {
          pool: {
            vehicle: {
              driverId,
            },
            status: {
              in: [PoolStatus.MATCHING, PoolStatus.ACTIVE],
            },
          },
        },
        status: {
          in: [
            RideStatus.MATCHED,
            RideStatus.DRIVER_ARRIVED,
            RideStatus.STARTED,
          ],
        },
      },
      select: {
        id: true,
        passengerId: true,
        passenger: {
          select: {
            name: true,
          },
        },
        pickupLat: true,
        pickupLng: true,
        destinationLat: true,
        destinationLng: true,
        status: true,
        requestedSeats: true,
        estimatedFarePaisa: true,
        createdAt: true,
        poolMember: {
          select: {
            poolId: true,
            farePaisa: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return rides.map((ride) => ({
      id: ride.id,
      passengerId: ride.passengerId,
      passengerName: ride.passenger.name,
      pickupLat: Number(ride.pickupLat),
      pickupLng: Number(ride.pickupLng),
      destinationLat: Number(ride.destinationLat),
      destinationLng: Number(ride.destinationLng),
      status: ride.status,
      requestedSeats: ride.requestedSeats,
      farePaisa: ride.poolMember?.farePaisa ?? ride.estimatedFarePaisa ?? 0,
      poolId: ride.poolMember?.poolId ?? '',
      createdAt: ride.createdAt,
    }));
  }

  async getNearbyRides(
    _driverId: string,
    lat: number,
    lng: number,
    maxDistanceMeter = 3000,
  ): Promise<NearbyDriverRide[]> {
    const requestedRides = await this.prisma.rideRequest.findMany({
      where: {
        status: RideStatus.REQUESTED,
        poolMember: null,
      },
      select: {
        id: true,
        passengerId: true,
        passenger: {
          select: {
            name: true,
          },
        },
        pickupLat: true,
        pickupLng: true,
        destinationLat: true,
        destinationLng: true,
        status: true,
        requestedSeats: true,
        estimatedFarePaisa: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const nearbyRides = requestedRides
      .map((ride) => {
        const pickupLat = Number(ride.pickupLat);
        const pickupLng = Number(ride.pickupLng);
        const distanceMeter = calculateHaversineDistanceMeter(
          lat,
          lng,
          pickupLat,
          pickupLng,
        );
        return {
          id: ride.id,
          passengerId: ride.passengerId,
          passengerName: ride.passenger.name,
          pickupLat,
          pickupLng,
          destinationLat: Number(ride.destinationLat),
          destinationLng: Number(ride.destinationLng),
          status: ride.status,
          requestedSeats: ride.requestedSeats,
          estimatedFarePaisa: ride.estimatedFarePaisa,
          distanceMeter,
          createdAt: ride.createdAt,
        };
      })
      .filter((ride) => ride.distanceMeter <= maxDistanceMeter)
      .sort((a, b) => a.distanceMeter - b.distanceMeter);

    return nearbyRides;
  }

  async acceptRide(driverId: string, rideId: string): Promise<RideResult> {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        passengerId: true,
        status: true,
        requestedSeats: true,
        poolMember: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }

    if (ride.status !== RideStatus.REQUESTED || ride.poolMember) {
      throw new BadRequestException('Ride request is not available for assignment');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { driverId },
      orderBy: { createdAt: 'asc' },
    });

    if (!vehicle) {
      throw new NotFoundException('No vehicle assigned to this driver');
    }

    if (vehicle.status !== VehicleStatus.ONLINE) {
      throw new BadRequestException('Vehicle must be online to accept rides');
    }

    const activePool = await this.prisma.pool.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: {
          in: [PoolStatus.MATCHING, PoolStatus.ACTIVE],
        },
      },
    });

    if (!activePool) {
      await this.poolCreationService.createPool(vehicle.id, [rideId]);
      return {
        id: ride.id,
        status: RideStatus.MATCHED,
      };
    }

    await this.poolSeatAllocationService.joinPool(activePool.id, rideId);
    await this.rideTransitionService.transitionRideStatus(
      rideId,
      RideStatus.MATCHED,
      driverId,
    );

    return {
      id: ride.id,
      status: RideStatus.MATCHED,
    };
  }

  async autoAssignClosestRide(
    driverId: string,
    lat: number,
    lng: number,
    maxDistanceMeter = 3000,
  ): Promise<RideResult & { distanceMeter: number }> {
    const nearby = await this.getNearbyRides(driverId, lat, lng, maxDistanceMeter);

    if (nearby.length === 0) {
      throw new NotFoundException('No available rides found within your pickup radius');
    }

    const closestRide = nearby[0];
    const result = await this.acceptRide(driverId, closestRide.id);

    return {
      ...result,
      distanceMeter: closestRide.distanceMeter,
    };
  }

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
