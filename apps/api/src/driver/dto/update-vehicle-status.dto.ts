import { IsEnum } from 'class-validator';
import { VehicleStatus } from '../../generated/prisma/client.js';

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus)
  readonly status: VehicleStatus;

  constructor(status: VehicleStatus) {
    this.status = status;
  }
}
