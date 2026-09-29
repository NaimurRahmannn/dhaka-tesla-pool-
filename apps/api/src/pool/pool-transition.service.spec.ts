import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PoolStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import { PoolTransitionService } from './pool-transition.service.js';

type TransitionState = {
  pool:
    | {
        id: string;
        status: PoolStatus;
      }
    | null;
};

function createPrismaMock(
  initialState: TransitionState,
  options: { failUpdate?: boolean } = {},
) {
  const committed: TransitionState = structuredClone(initialState);

  const prisma = {
    $transaction: vi.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) => {
        const staged = structuredClone(committed);

        const transaction = {
          pool: {
            findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
              if (!staged.pool || staged.pool.id !== where.id) {
                return null;
              }

              return {
                id: staged.pool.id,
                status: staged.pool.status,
              };
            }),
            update: vi.fn(
              async ({
                where,
                data,
              }: {
                where: { id: string };
                data: { status: PoolStatus };
              }) => {
                if (options.failUpdate) {
                  throw new Error('pool update failed');
                }

                if (!staged.pool || staged.pool.id !== where.id) {
                  throw new Error('pool not found');
                }

                staged.pool.status = data.status;

                return {
                  id: staged.pool.id,
                  status: staged.pool.status,
                };
              },
            ),
          },
        };

        const result = await callback(transaction);

        committed.pool = staged.pool;

        return result;
      },
    ),
  } as unknown as PrismaService;

  return {
    committed,
    prisma,
  };
}

async function createService(
  initialStatus: PoolStatus | null,
  options: { failUpdate?: boolean } = {},
) {
  const { committed, prisma } = createPrismaMock(
    {
      pool:
        initialStatus === null
          ? null
          : {
              id: 'pool-id',
              status: initialStatus,
            },
    },
    options,
  );
  const module = await Test.createTestingModule({
    providers: [
      PoolTransitionService,
      {
        provide: PrismaService,
        useValue: prisma,
      },
    ],
  }).compile();

  return {
    committed,
    module,
    service: module.get(PoolTransitionService),
  };
}

describe('PoolTransitionService', () => {
  it('transitions MATCHING to ACTIVE', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.MATCHING,
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.ACTIVE),
    ).resolves.toEqual({
      id: 'pool-id',
      status: PoolStatus.ACTIVE,
    });

    expect(committed.pool?.status).toBe(PoolStatus.ACTIVE);

    await module.close();
  });

  it('transitions ACTIVE to COMPLETED', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.ACTIVE,
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.COMPLETED),
    ).resolves.toEqual({
      id: 'pool-id',
      status: PoolStatus.COMPLETED,
    });

    expect(committed.pool?.status).toBe(PoolStatus.COMPLETED);

    await module.close();
  });

  it('transitions MATCHING to CANCELLED', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.MATCHING,
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.CANCELLED),
    ).resolves.toEqual({
      id: 'pool-id',
      status: PoolStatus.CANCELLED,
    });

    expect(committed.pool?.status).toBe(PoolStatus.CANCELLED);

    await module.close();
  });

  it('transitions ACTIVE to CANCELLED', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.ACTIVE,
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.CANCELLED),
    ).resolves.toEqual({
      id: 'pool-id',
      status: PoolStatus.CANCELLED,
    });

    expect(committed.pool?.status).toBe(PoolStatus.CANCELLED);

    await module.close();
  });

  it('rejects invalid transitions without changing the pool', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.COMPLETED,
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.ACTIVE),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(committed.pool?.status).toBe(PoolStatus.COMPLETED);

    await module.close();
  });

  it('rejects missing pools', async () => {
    const { module, service } = await createService(null);

    await expect(
      service.transitionPoolStatus('missing-pool-id', PoolStatus.ACTIVE),
    ).rejects.toBeInstanceOf(NotFoundException);

    await module.close();
  });

  it('rolls back when the status update fails', async () => {
    const { committed, module, service } = await createService(
      PoolStatus.MATCHING,
      { failUpdate: true },
    );

    await expect(
      service.transitionPoolStatus('pool-id', PoolStatus.ACTIVE),
    ).rejects.toThrow('pool update failed');

    expect(committed.pool?.status).toBe(PoolStatus.MATCHING);

    await module.close();
  });
});
