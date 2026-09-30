import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RideStatus, UserRole } from '../generated/prisma/client.js';
import type { PublicUser } from '../users/users.types.js';
import { DriverPoolService } from './driver-pool.service.js';
import { DriverRideService } from './driver-ride.service.js';
import { DriverVehicleService } from './driver-vehicle.service.js';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto.js';

@Controller('driver')
export class DriverController {
  constructor(
    private readonly driverVehicleService: DriverVehicleService,
    private readonly driverPoolService: DriverPoolService,
    private readonly driverRideService: DriverRideService,
  ) {}

  @Get('pools')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getAssignedPools(@CurrentUser() user: PublicUser) {
    return this.driverPoolService.getAssignedPools(user.id);
  }

  @Get('vehicles')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getVehicles(@CurrentUser() user: PublicUser) {
    return this.driverVehicleService.getDriverVehicles(user.id);
  }

  @Get('rides/assigned')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getAssignedRides(@CurrentUser() user: PublicUser) {
    return this.driverRideService.getAssignedRides(user.id);
  }

  @Get('rides/completed')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getCompletedRides(@CurrentUser() user: PublicUser) {
    return this.driverRideService.getCompletedRides(user.id);
  }

  @Get('rides/nearby')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  getNearbyRides(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string | undefined,
    @CurrentUser() user: PublicUser,
  ) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRadius = radius ? Number(radius) : 3000;

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      throw new BadRequestException('Valid lat and lng query parameters are required');
    }

    return this.driverRideService.getNearbyRides(
      user.id,
      parsedLat,
      parsedLng,
      parsedRadius,
    );
  }

  @Post('rides/auto-assign')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  autoAssign(
    @Body() dto: { lat: number; lng: number; radius?: number },
    @CurrentUser() user: PublicUser,
  ) {
    if (typeof dto?.lat !== 'number' || typeof dto?.lng !== 'number') {
      throw new BadRequestException('Valid lat and lng in body are required');
    }

    return this.driverRideService.autoAssignClosestRide(
      user.id,
      dto.lat,
      dto.lng,
      dto.radius ?? 3000,
    );
  }

  @Post('rides/:id/accept')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  acceptRide(
    @Param('id') rideId: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.driverRideService.acceptRide(user.id, rideId);
  }

  @Patch('rides/:id/arrive')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  arriveAtRide(
    @Param('id') rideId: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.driverRideService.transitionAssignedRide(
      user.id,
      rideId,
      RideStatus.DRIVER_ARRIVED,
    );
  }

  @Patch('rides/:id/start')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  startRide(
    @Param('id') rideId: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.driverRideService.transitionAssignedRide(
      user.id,
      rideId,
      RideStatus.STARTED,
    );
  }

  @Patch('rides/:id/complete')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DRIVER)
  completeRide(
    @Param('id') rideId: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.driverRideService.transitionAssignedRide(
      user.id,
      rideId,
      RideStatus.COMPLETED,
    );
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
