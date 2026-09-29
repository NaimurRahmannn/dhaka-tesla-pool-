import { RideStatus } from '../../generated/prisma/client.js';

export const rideStatuses: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.STARTED,
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];
