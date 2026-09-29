import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import { DriverVehicleService } from './driver-vehicle.service.js';

type VehicleRecord = {
  id: string;
  driverId: string;
  name: string;
  capacity: number;
  status: VehicleStatus;
};

function createPrismaMock(vehicle: VehicleRecord | null) {
  const committed = {
    vehicle: vehicle ? { ...vehicle } : null,
  };

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const staged = {
          vehicle: committed.vehicle ? { ...committed.vehicle } : null,
        };
        const transaction = {
          vehicle: {
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
              staged.vehicle?.id === where.id ? staged.vehicle : null,
            ),
            update: vi.fn(
              async ({
                where,
                data,
              }: {
                where: { id: string };
                data: { status: VehicleStatus };
              }) => {
                if (!staged.vehicle || staged.vehicle.id !== where.id) {
                  throw new Error('vehicle not found');
                }

                staged.vehicle.status = data.status;

                return staged.vehicle;
              },
            ),
          },
        };

        const result = await callback(transaction);
        committed.vehicle = staged.vehicle;

        return result;
      },
    ),
  } as unknown as PrismaService;

  return {
    committed,
    prisma,
  };
}

describe('DriverVehicleService', () => {
  it('updates a driver-owned vehicle status', async () => {
    const { committed, prisma } = createPrismaMock({
      id: 'bullet-id',
      driverId: 'jashim-id',
      name: 'Bullet',
      capacity: 3,
      status: VehicleStatus.OFFLINE,
    });
    const service = new DriverVehicleService(prisma);

    await expect(
      service.updateVehicleStatus(
        'jashim-id',
        'bullet-id',
        VehicleStatus.ONLINE,
      ),
    ).resolves.toEqual({
      id: 'bullet-id',
      driverId: 'jashim-id',
      name: 'Bullet',
      capacity: 3,
      status: VehicleStatus.ONLINE,
    });

    expect(committed.vehicle?.status).toBe(VehicleStatus.ONLINE);
  });

  it('rejects status updates from a non-owner', async () => {
    const { committed, prisma } = createPrismaMock({
      id: 'bullet-id',
      driverId: 'jashim-id',
      name: 'Bullet',
      capacity: 3,
      status: VehicleStatus.OFFLINE,
    });
    const service = new DriverVehicleService(prisma);

    await expect(
      service.updateVehicleStatus(
        'nusrat-id',
        'bullet-id',
        VehicleStatus.ONLINE,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(committed.vehicle?.status).toBe(VehicleStatus.OFFLINE);
  });

  it('rejects missing vehicles', async () => {
    const { prisma } = createPrismaMock(null);
    const service = new DriverVehicleService(prisma);

    await expect(
      service.updateVehicleStatus(
        'jashim-id',
        'missing-vehicle-id',
        VehicleStatus.ONLINE,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
