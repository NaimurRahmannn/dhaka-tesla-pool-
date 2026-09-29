import { Module } from '@nestjs/common';
import { RouteCorridorMatcher } from './matching/route-corridor-matcher.js';
import { PoolController } from './pool.controller.js';
import { PoolService } from './pool.service.js';

@Module({
  controllers: [PoolController],
  providers: [PoolService, RouteCorridorMatcher],
  exports: [PoolService],
})
export class PoolModule {}
