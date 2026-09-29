import { Module } from '@nestjs/common';
import { FareModule } from '../fare/fare.module.js';
import { RoutingModule } from '../routing/routing.module.js';
import { UsersModule } from '../users/users.module.js';
import { RideController } from './ride.controller.js';
import { RideService } from './ride.service.js';

@Module({
  imports: [UsersModule, RoutingModule, FareModule],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}
