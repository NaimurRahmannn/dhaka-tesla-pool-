import { RideStatus } from '../../generated/prisma/client.js';

export const rideStatuses: readonly RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.STARTED,
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];

const allowedTransitions: Record<RideStatus, readonly RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [
    RideStatus.DRIVER_ARRIVED,
    RideStatus.CANCELLED,
  ],
  [RideStatus.DRIVER_ARRIVED]: [
    RideStatus.STARTED,
    RideStatus.CANCELLED,
  ],
  [RideStatus.STARTED]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

export function canTransition(
  currentStatus: RideStatus,
  nextStatus: RideStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}
