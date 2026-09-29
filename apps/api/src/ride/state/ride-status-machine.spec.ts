import { RideStatus } from '../../generated/prisma/client.js';
import { rideStatuses } from './ride-status-machine.js';

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
});
