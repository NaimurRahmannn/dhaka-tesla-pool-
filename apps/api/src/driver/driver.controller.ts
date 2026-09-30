import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserRole } from '../generated/prisma/client.js';
import type { PublicUser } from '../users/users.types.js';
import { DriverPoolService } from './driver-pool.service.js';
import { DriverVehicleService } from './driver-vehicle.service.js';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto.js';

@Controller('driver')
export class DriverController {
  constructor(
    private readonly driverVehicleService: DriverVehicleService,
    private readonly driverPoolService: DriverPoolService,
  ) {}

  @Get('pools')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getAssignedPools(@CurrentUser() user: PublicUser) {
    return this.driverPoolService.getAssignedPools(user.id);
  }

  @Patch('vehicles/:id/status')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  updateVehicleStatus(
    @Param('id') vehicleId: string,
    @Body() dto: UpdateVehicleStatusDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.driverVehicleService.updateVehicleStatus(
      user.id,
      vehicleId,
      dto.status,
    );
  }
}
