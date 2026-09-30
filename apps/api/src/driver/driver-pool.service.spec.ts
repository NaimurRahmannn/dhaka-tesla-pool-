import { PoolStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import { DriverPoolService } from './driver-pool.service.js';

type PoolRecord = {
  id: string;
  status: PoolStatus;
  vehicleId: string;
  vehicleDriverId: string;
  memberCount: number;
};

function createPrismaMock(pools: PoolRecord[]) {
  const findMany = vi.fn(
    async ({
      where,
    }: {
      where: { vehicle: { driverId: string } };
    }) =>
      pools
        .filter((pool) => pool.vehicleDriverId === where.vehicle.driverId)
        .map((pool) => ({
          id: pool.id,
          status: pool.status,
          vehicleId: pool.vehicleId,
          _count: {
            members: pool.memberCount,
          },
        })),
  );
  const prisma = {
    pool: {
      findMany,
    },
  } as unknown as PrismaService;

  return {
    findMany,
    prisma,
  };
}

describe('DriverPoolService', () => {
  it('returns pools assigned to vehicles owned by the driver', async () => {
    const { findMany, prisma } = createPrismaMock([
      {
        id: 'pool-1',
        status: PoolStatus.MATCHING,
        vehicleId: 'bullet-id',
        vehicleDriverId: 'jashim-id',
        memberCount: 2,
      },
      {
        id: 'pool-2',
        status: PoolStatus.ACTIVE,
        vehicleId: 'other-vehicle-id',
        vehicleDriverId: 'other-driver-id',
        memberCount: 1,
      },
    ]);
    const service = new DriverPoolService(prisma);

    await expect(service.getAssignedPools('jashim-id')).resolves.toEqual([
      {
        id: 'pool-1',
        status: PoolStatus.MATCHING,
        vehicleId: 'bullet-id',
        memberCount: 2,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        vehicle: {
          driverId: 'jashim-id',
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
  });

  it("does not return another driver's pools", async () => {
    const { prisma } = createPrismaMock([
      {
        id: 'pool-2',
        status: PoolStatus.ACTIVE,
        vehicleId: 'other-vehicle-id',
        vehicleDriverId: 'other-driver-id',
        memberCount: 1,
      },
    ]);
    const service = new DriverPoolService(prisma);

    await expect(service.getAssignedPools('jashim-id')).resolves.toEqual([]);
  });

  it('returns an empty array when the driver has no assigned pools', async () => {
    const { prisma } = createPrismaMock([]);
    const service = new DriverPoolService(prisma);

    await expect(service.getAssignedPools('jashim-id')).resolves.toEqual([]);
  });

  it('returns only the required summary fields', async () => {
    const { prisma } = createPrismaMock([
      {
        id: 'pool-1',
        status: PoolStatus.MATCHING,
        vehicleId: 'bullet-id',
        vehicleDriverId: 'jashim-id',
        memberCount: 2,
      },
    ]);
    const service = new DriverPoolService(prisma);

    const [summary] = await service.getAssignedPools('jashim-id');

    expect(Object.keys(summary ?? {}).sort()).toEqual([
      'id',
      'memberCount',
      'status',
      'vehicleId',
    ]);
  });
});
