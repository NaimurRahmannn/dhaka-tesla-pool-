import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { FareService } from '../fare/fare.service.js';
import { RoutingService } from '../routing/routing.service.js';
import { RideTransitionService } from '../ride/ride-transition.service.js';
import { PrismaService } from '../users/prisma.service.js';
import type { JoinPoolDto } from './dto/join-pool.dto.js';
import type { PoolMatchResult } from './interfaces/pool-match-result.interface.js';
import { PoolCreationService } from './pool-creation.service.js';
import { PoolSeatAllocationService } from './pool-seat-allocation.service.js';
import { PoolTransitionService } from './pool-transition.service.js';
import { PoolModule } from './pool.module.js';
import { PoolService } from './pool.service.js';

describe('PoolModule', () => {
  it('compiles and provides PoolService through dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
        }),
        PoolModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(FareService)
      .useValue({})
      .overrideProvider(RoutingService)
      .useValue({})
      .overrideProvider(RideTransitionService)
      .useValue({})
      .compile();

    expect(module.get(PoolService)).toBeInstanceOf(PoolService);
    expect(module.get(PoolCreationService)).toBeInstanceOf(PoolCreationService);
    expect(module.get(PoolSeatAllocationService)).toBeInstanceOf(
      PoolSeatAllocationService,
    );
    expect(module.get(PoolTransitionService)).toBeInstanceOf(
      PoolTransitionService,
    );

    await module.close();
  });

  it('exposes minimal pooling foundation contracts', () => {
    const joinPoolDto: JoinPoolDto = {
      rideRequestId: 'ride-request-id',
    };
    const poolMatchResult: PoolMatchResult = {
      poolId: 'pool-id',
      compatible: true,
    };

    expect(joinPoolDto).toEqual({
      rideRequestId: 'ride-request-id',
    });
    expect(poolMatchResult).toEqual({
      poolId: 'pool-id',
      compatible: true,
    });
  });
});
