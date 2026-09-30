import { Module } from '@nestjs/common';
import { PoolModule } from '../pool/pool.module.js';
import { RideModule } from '../ride/ride.module.js';
import { UsersModule } from '../users/users.module.js';
import { DriverController } from './driver.controller.js';
import { DriverPoolService } from './driver-pool.service.js';
import { DriverRideService } from './driver-ride.service.js';
import { DriverVehicleService } from './driver-vehicle.service.js';
import { DriverService } from './driver.service.js';

@Module({
  imports: [UsersModule, RideModule, PoolModule],
  controllers: [DriverController],
  providers: [
    DriverService,
    DriverVehicleService,
    DriverPoolService,
    DriverRideService,
  ],
  exports: [
    DriverService,
    DriverVehicleService,
    DriverPoolService,
    DriverRideService,
  ],
})
export class DriverModule {}
