export class JoinPoolDto {
  readonly rideRequestId: string;

  constructor(rideRequestId: string) {
    this.rideRequestId = rideRequestId;
  }
}
