import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';

export interface PoolSeatAllocationResult {
  poolId: string;
  rideRequestId: string;
  seatCount: number;
  farePaisa: number;
}

@Injectable()
export class PoolSeatAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async joinPool(
    poolId: string,
    rideRequestId: string,
  ): Promise<PoolSeatAllocationResult> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockPoolForUpdate(tx, poolId);

      const currentSeats = await this.getCurrentSeats(tx, poolId);
      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        select: {
          id: true,
          vehicle: {
            select: {
              capacity: true,
            },
          },
        },
      });

      if (!pool) {
        throw new NotFoundException('Pool not found');
      }

      const ride = await tx.rideRequest.findUnique({
        where: { id: rideRequestId },
        select: {
          id: true,
          requestedSeats: true,
          estimatedFarePaisa: true,
        },
      });

      if (!ride) {
        throw new NotFoundException('Ride request not found');
      }

      if (ride.estimatedFarePaisa === null) {
        throw new BadRequestException('Ride request fare is not available');
      }

      if (currentSeats + ride.requestedSeats > pool.vehicle.capacity) {
        throw new BadRequestException('Pool capacity exceeded');
      }

      return tx.poolMember.create({
        data: {
          poolId,
          rideRequestId: ride.id,
          seatCount: ride.requestedSeats,
          farePaisa: ride.estimatedFarePaisa,
        },
        select: {
          poolId: true,
          rideRequestId: true,
          seatCount: true,
          farePaisa: true,
        },
      });
    });
  }

  private async lockPoolForUpdate(
    tx: Prisma.TransactionClient,
    poolId: string,
  ): Promise<void> {
    const lockedPools = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM pools WHERE id = ${poolId}::uuid FOR UPDATE`,
    );

    if (lockedPools.length === 0) {
      throw new NotFoundException('Pool not found');
    }
  }

  private async getCurrentSeats(
    tx: Prisma.TransactionClient,
    poolId: string,
  ): Promise<number> {
    const currentSeats = await tx.poolMember.aggregate({
      where: { poolId },
      _sum: {
        seatCount: true,
      },
    });

    return currentSeats._sum.seatCount ?? 0;
  }
}
