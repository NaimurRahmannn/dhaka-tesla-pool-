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
