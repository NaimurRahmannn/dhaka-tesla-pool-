import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../users/prisma.service.js';
import { canTransition } from './state/pool-status-machine.js';

export interface PoolTransitionResult {
  id: string;
  status: PoolStatus;
}

@Injectable()
export class PoolTransitionService {
  constructor(private readonly prisma: PrismaService) {}

  transitionPoolStatus(
    poolId: string,
    nextStatus: PoolStatus,
    transactionClient?: Prisma.TransactionClient,
  ): Promise<PoolTransitionResult> {
    if (transactionClient) {
      return this.transitionPoolStatusWithClient(
        transactionClient,
        poolId,
        nextStatus,
      );
    }

    return this.prisma.$transaction((tx) =>
      this.transitionPoolStatusWithClient(tx, poolId, nextStatus),
    );
  }

  private async transitionPoolStatusWithClient(
    tx: Prisma.TransactionClient,
    poolId: string,
    nextStatus: PoolStatus,
  ): Promise<PoolTransitionResult> {
    const pool = await tx.pool.findUnique({
      where: { id: poolId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    if (!canTransition(pool.status, nextStatus)) {
      throw new BadRequestException(
        `Invalid pool status transition: ${pool.status} -> ${nextStatus}`,
      );
    }

    return tx.pool.update({
      where: { id: poolId },
      data: { status: nextStatus },
      select: {
        id: true,
        status: true,
      },
    });
  }
}
