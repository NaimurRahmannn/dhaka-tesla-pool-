import { CreateRideRequestDto } from './create-ride-request.dto.js';

describe('CreateRideRequestDto', () => {
  it('contains only pickup and destination coordinates', () => {
    const dto = new CreateRideRequestDto(23.7937, 90.4066, 23.7806, 90.4071);

    expect(dto).toEqual({
      pickupLat: 23.7937,
      pickupLng: 90.4066,
      destinationLat: 23.7806,
      destinationLng: 90.4071,
    });
    expect(Object.keys(dto)).toEqual([
      'pickupLat',
      'pickupLng',
      'destinationLat',
      'destinationLng',
    ]);
  });
});
