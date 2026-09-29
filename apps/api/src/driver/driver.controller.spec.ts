import { ROLES_KEY } from '../auth/auth.constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UserRole, VehicleStatus } from '../generated/prisma/client.js';
import { DriverController } from './driver.controller.js';
import type { DriverVehicleService } from './driver-vehicle.service.js';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto.js';

describe('DriverController authorization', () => {
  it('protects vehicle status updates with JWT authentication and driver role metadata', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      DriverController.prototype.updateVehicleStatus,
    ) as Array<new (...args: never[]) => unknown>;

    expect(guards).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        DriverController.prototype.updateVehicleStatus,
      ),
    ).toEqual([UserRole.DRIVER]);
  });
});

describe('DriverController', () => {
  it('uses the authenticated driver id when updating vehicle status', async () => {
    const driverVehicleService = {
      updateVehicleStatus: vi.fn().mockResolvedValue({
        id: 'bullet-id',
        driverId: 'jashim-id',
        name: 'Bullet',
        capacity: 3,
        status: VehicleStatus.ONLINE,
      }),
    } as unknown as DriverVehicleService;
    const controller = new DriverController(driverVehicleService);

    await expect(
      controller.updateVehicleStatus(
        'bullet-id',
        new UpdateVehicleStatusDto(VehicleStatus.ONLINE),
        {
          id: 'jashim-id',
          name: 'Jashim',
          email: 'jashim@example.com',
          role: UserRole.DRIVER,
        },
      ),
    ).resolves.toEqual({
      id: 'bullet-id',
      driverId: 'jashim-id',
      name: 'Bullet',
      capacity: 3,
      status: VehicleStatus.ONLINE,
    });

    expect(driverVehicleService.updateVehicleStatus).toHaveBeenCalledWith(
      'jashim-id',
      'bullet-id',
      VehicleStatus.ONLINE,
    );
  });
});
