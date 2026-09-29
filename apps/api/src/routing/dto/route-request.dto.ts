export class RouteRequestDto {
  constructor(
    public readonly pickupLat: number,
    public readonly pickupLng: number,
    public readonly destinationLat: number,
    public readonly destinationLng: number,
  ) {}
}
