import { Test } from '@nestjs/testing';
import type { JoinPoolDto } from './dto/join-pool.dto.js';
import type { PoolMatchResult } from './interfaces/pool-match-result.interface.js';
import { PoolModule } from './pool.module.js';
import { PoolService } from './pool.service.js';

describe('PoolModule', () => {
  it('compiles and provides PoolService through dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [PoolModule],
    }).compile();

    expect(module.get(PoolService)).toBeInstanceOf(PoolService);

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
