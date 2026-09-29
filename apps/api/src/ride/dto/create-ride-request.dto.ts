import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class CreateRideRequestDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsLatitude()
  readonly pickupLat: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsLongitude()
  readonly pickupLng: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsLatitude()
  readonly destinationLat: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsLongitude()
  readonly destinationLng: number;

  constructor(
    pickupLat: number,
    pickupLng: number,
    destinationLat: number,
    destinationLng: number,
  ) {
    this.pickupLat = pickupLat;
    this.pickupLng = pickupLng;
    this.destinationLat = destinationLat;
    this.destinationLng = destinationLng;
  }
}
