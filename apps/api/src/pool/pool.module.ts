import { Module } from '@nestjs/common';
import { FareModule } from '../fare/fare.module.js';
import { RideModule } from '../ride/ride.module.js';
import { UsersModule } from '../users/users.module.js';
import { RouteCorridorMatcher } from './matching/route-corridor-matcher.js';
import { PoolCreationService } from './pool-creation.service.js';
import { PoolSeatAllocationService } from './pool-seat-allocation.service.js';
import { PoolTransitionService } from './pool-transition.service.js';
import { PoolController } from './pool.controller.js';
import { PoolService } from './pool.service.js';

@Module({
  imports: [UsersModule, FareModule, RideModule],
  controllers: [PoolController],
  providers: [
    PoolService,
    PoolCreationService,
    PoolSeatAllocationService,
    PoolTransitionService,
    RouteCorridorMatcher,
  ],
  exports: [
    PoolService,
    PoolCreationService,
    PoolSeatAllocationService,
    PoolTransitionService,
  ],
})
export class PoolModule {}
