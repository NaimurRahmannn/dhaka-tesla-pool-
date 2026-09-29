import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserRole } from '../generated/prisma/client.js';
import type { PublicUser } from '../users/users.types.js';
import { CreateRideRequestDto } from './dto/create-ride-request.dto.js';
import type { RideResult } from './interfaces/ride-result.interface.js';
import { RideService } from './ride.service.js';

@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PASSENGER)
  create(
    @Body() dto: CreateRideRequestDto,
    @CurrentUser() user: PublicUser,
  ): Promise<RideResult> {
    return this.rideService.createRideRequest(dto, user.id);
  }
}
