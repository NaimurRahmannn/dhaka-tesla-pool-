import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { DriverController } from './driver.controller.js';
import { DriverVehicleService } from './driver-vehicle.service.js';
import { DriverService } from './driver.service.js';

@Module({
  imports: [UsersModule],
  controllers: [DriverController],
  providers: [DriverService, DriverVehicleService],
  exports: [DriverService, DriverVehicleService],
})
export class DriverModule {}
