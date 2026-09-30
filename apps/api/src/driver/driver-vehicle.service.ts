import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';

export interface DriverVehicleResult {
  id: string;
  driverId: string;
  name: string;
  capacity: number;
  status: VehicleStatus;
}

@Injectable()
export class DriverVehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async getDriverVehicles(driverId: string): Promise<DriverVehicleResult[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { driverId },
      select: {
        id: true,
        driverId: true,
        name: true,
        capacity: true,
        status: true,
      },
    });

    if (vehicles.length > 0) {
      return vehicles;
    }

    const created = await this.prisma.vehicle.create({
      data: {
        driverId,
        name: 'Bullet',
        capacity: 3,
        status: VehicleStatus.OFFLINE,
      },
      select: {
        id: true,
        driverId: true,
        name: true,
        capacity: true,
        status: true,
      },
    });

    return [created];
  }

  updateVehicleStatus(
    driverId: string,
    vehicleId: string,
    status: VehicleStatus,
  ): Promise<DriverVehicleResult> {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        select: {
          id: true,
          driverId: true,
          name: true,
          capacity: true,
          status: true,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      if (vehicle.driverId !== driverId) {
        throw new ForbiddenException('Vehicle does not belong to this driver');
      }

      return tx.vehicle.update({
        where: { id: vehicleId },
        data: { status },
        select: {
          id: true,
          driverId: true,
          name: true,
          capacity: true,
          status: true,
        },
      });
    });
  }
}
