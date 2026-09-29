import { RideStatus } from '../../generated/prisma/client.js';
import { canTransition, rideStatuses } from './ride-status-machine.js';

describe('ride status machine foundation', () => {
  it('exposes the approved ride statuses without transition logic', () => {
    expect(rideStatuses).toEqual([
      RideStatus.REQUESTED,
      RideStatus.MATCHED,
      RideStatus.DRIVER_ARRIVED,
      RideStatus.STARTED,
      RideStatus.COMPLETED,
      RideStatus.CANCELLED,
    ]);
  });

  it.each([
    [RideStatus.REQUESTED, RideStatus.MATCHED],
    [RideStatus.REQUESTED, RideStatus.CANCELLED],
    [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED],
    [RideStatus.MATCHED, RideStatus.CANCELLED],
    [RideStatus.DRIVER_ARRIVED, RideStatus.STARTED],
    [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
    [RideStatus.STARTED, RideStatus.COMPLETED],
  ])('allows %s -> %s', (currentStatus, nextStatus) => {
    expect(canTransition(currentStatus, nextStatus)).toBe(true);
  });

  it.each([
    [RideStatus.COMPLETED, RideStatus.STARTED],
    [RideStatus.CANCELLED, RideStatus.REQUESTED],
    [RideStatus.REQUESTED, RideStatus.STARTED],
  ])('rejects %s -> %s', (currentStatus, nextStatus) => {
    expect(canTransition(currentStatus, nextStatus)).toBe(false);
  });
});
