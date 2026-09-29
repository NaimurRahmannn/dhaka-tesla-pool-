import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RideStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import { RideTransitionService } from './ride-transition.service.js';

type TransitionState = {
  status: RideStatus;
  history: Array<Record<string, unknown>>;
};

function createPrismaMock(
  initialStatus: RideStatus,
  failHistoryCreation = false,
) {
  const committed: TransitionState = {
    status: initialStatus,
    history: [],
  };

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        let stagedStatus = committed.status;
        const stagedHistory: Array<Record<string, unknown>> = [];

        const transaction = {
          rideRequest: {
            findUnique: vi.fn(async () => ({
              id: 'ride-id',
              status: stagedStatus,
            })),
            update: vi.fn(async ({ data }: { data: { status: RideStatus } }) => {
              stagedStatus = data.status;
              return {
                id: 'ride-id',
                status: stagedStatus,
              };
            }),
          },
          rideStatusHistory: {
            create: vi.fn(
              async ({ data }: { data: Record<string, unknown> }) => {
                if (failHistoryCreation) {
                  throw new Error('history creation failed');
                }

                stagedHistory.push(data);
                return data;
              },
            ),
          },
        };

        const result = await callback(transaction);

        committed.status = stagedStatus;
        committed.history.push(...stagedHistory);

        return result;
      },
    ),
  } as unknown as PrismaService;

  return { prisma, committed };
}

function createModule(prisma: PrismaService): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      RideTransitionService,
      {
        provide: PrismaService,
        useValue: prisma,
      },
    ],
  }).compile();
}

describe('RideTransitionService', () => {
  it('transitions REQUESTED to MATCHED and records history', async () => {
    const { prisma, committed } = createPrismaMock(RideStatus.REQUESTED);
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    await expect(
      service.transitionRideStatus(
        'ride-id',
        RideStatus.MATCHED,
        'actor-id',
      ),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.MATCHED,
    });

    expect(committed.status).toBe(RideStatus.MATCHED);
    expect(committed.history).toEqual([
      {
        rideRequestId: 'ride-id',
        previousStatus: RideStatus.REQUESTED,
        newStatus: RideStatus.MATCHED,
        changedBy: 'actor-id',
      },
    ]);

    await module.close();
  });

  it('supports the complete ride lifecycle', async () => {
    const { prisma, committed } = createPrismaMock(RideStatus.REQUESTED);
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    for (const nextStatus of [
      RideStatus.MATCHED,
      RideStatus.DRIVER_ARRIVED,
      RideStatus.STARTED,
      RideStatus.COMPLETED,
    ]) {
      await expect(
        service.transitionRideStatus('ride-id', nextStatus, 'actor-id'),
      ).resolves.toEqual({
        id: 'ride-id',
        status: nextStatus,
      });
    }

    expect(committed.status).toBe(RideStatus.COMPLETED);
    expect(committed.history).toHaveLength(4);

    await module.close();
  });

  it('supports cancellation from REQUESTED', async () => {
    const { prisma, committed } = createPrismaMock(RideStatus.REQUESTED);
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    await expect(
      service.transitionRideStatus(
        'ride-id',
        RideStatus.CANCELLED,
        'actor-id',
      ),
    ).resolves.toEqual({
      id: 'ride-id',
      status: RideStatus.CANCELLED,
    });

    expect(committed.status).toBe(RideStatus.CANCELLED);

    await module.close();
  });

  it('rejects invalid transitions without changing the ride', async () => {
    const { prisma, committed } = createPrismaMock(RideStatus.COMPLETED);
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    await expect(
      service.transitionRideStatus(
        'ride-id',
        RideStatus.STARTED,
        'actor-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(committed.status).toBe(RideStatus.COMPLETED);
    expect(committed.history).toHaveLength(0);

    await module.close();
  });

  it('rolls back the status update when history creation fails', async () => {
    const { prisma, committed } = createPrismaMock(
      RideStatus.REQUESTED,
      true,
    );
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    await expect(
      service.transitionRideStatus(
        'ride-id',
        RideStatus.MATCHED,
        'actor-id',
      ),
    ).rejects.toThrow('history creation failed');

    expect(committed.status).toBe(RideStatus.REQUESTED);
    expect(committed.history).toHaveLength(0);

    await module.close();
  });

  it('rejects a missing ride', async () => {
    const prisma = {
      $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
        callback({
          rideRequest: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        }),
      ),
    } as unknown as PrismaService;
    const module = await createModule(prisma);
    const service = module.get(RideTransitionService);

    await expect(
      service.transitionRideStatus(
        'missing-ride-id',
        RideStatus.MATCHED,
        'actor-id',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    await module.close();
  });
});
