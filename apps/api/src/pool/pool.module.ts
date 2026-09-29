import { Module } from '@nestjs/common';
import { FareModule } from '../fare/fare.module.js';
import { RideModule } from '../ride/ride.module.js';
import { UsersModule } from '../users/users.module.js';
import { RouteCorridorMatcher } from './matching/route-corridor-matcher.js';
import { PoolCreationService } from './pool-creation.service.js';
import { PoolController } from './pool.controller.js';
import { PoolService } from './pool.service.js';

@Module({
  imports: [UsersModule, FareModule, RideModule],
  controllers: [PoolController],
  providers: [PoolService, PoolCreationService, RouteCorridorMatcher],
  exports: [PoolService, PoolCreationService],
})
export class PoolModule {}
