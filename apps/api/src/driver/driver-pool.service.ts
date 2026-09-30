import { Injectable } from '@nestjs/common';
import { PoolStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';

export interface DriverPoolSummary {
  id: string;
  status: PoolStatus;
  vehicleId: string;
  memberCount: number;
}

@Injectable()
export class DriverPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignedPools(driverId: string): Promise<DriverPoolSummary[]> {
    const pools = await this.prisma.pool.findMany({
      where: {
        vehicle: {
          driverId,
        },
      },
      select: {
        id: true,
        status: true,
        vehicleId: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pools.map((pool) => ({
      id: pool.id,
      status: pool.status,
      vehicleId: pool.vehicleId,
      memberCount: pool._count.members,
    }));
  }
}
