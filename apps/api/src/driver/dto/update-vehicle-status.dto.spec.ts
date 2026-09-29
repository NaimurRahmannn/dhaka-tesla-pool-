import { validate } from 'class-validator';
import { VehicleStatus } from '../../generated/prisma/client.js';
import { UpdateVehicleStatusDto } from './update-vehicle-status.dto.js';

describe('UpdateVehicleStatusDto', () => {
  it('accepts an existing vehicle status enum value', async () => {
    const dto = new UpdateVehicleStatusDto(VehicleStatus.ONLINE);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid vehicle status values', async () => {
    const dto = new UpdateVehicleStatusDto('AVAILABLE' as VehicleStatus);

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'status',
        }),
      ]),
    );
  });
});
