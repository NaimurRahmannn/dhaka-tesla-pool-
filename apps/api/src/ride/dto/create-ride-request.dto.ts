export class CreateRideRequestDto {
  constructor(
    public readonly pickupLat: number,
    public readonly pickupLng: number,
    public readonly destinationLat: number,
    public readonly destinationLng: number,
  ) {}
}
