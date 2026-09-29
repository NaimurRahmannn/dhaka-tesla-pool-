import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreatePoolDto {
  @IsUUID()
  readonly vehicleId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  readonly rideRequestIds: string[];

  constructor(vehicleId: string, rideRequestIds: string[]) {
    this.vehicleId = vehicleId;
    this.rideRequestIds = rideRequestIds;
  }
}
