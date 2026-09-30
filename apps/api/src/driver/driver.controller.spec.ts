import { ROLES_KEY } from '../auth/auth.constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PoolStatus, UserRole, VehicleStatus } from '../generated/prisma/client.js';
import { DriverController } from './driver.controller.js';
import type { DriverPoolService } from './driver-pool.service.js';
import type { DriverVehicleService } from './driver-vehicle.service.js';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto.js';

describe('DriverController authorization', () => {
  it('protects assigned pool retrieval with JWT authentication and driver role metadata', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      DriverController.prototype.getAssignedPools,
    ) as Array<new (...args: never[]) => unknown>;

    expect(guards).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(ROLES_KEY, DriverController.prototype.getAssignedPools),
    ).toEqual([UserRole.DRIVER]);
  });

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
  it('uses the authenticated driver id when retrieving assigned pools', async () => {
    const driverVehicleService = {
      updateVehicleStatus: vi.fn(),
    } as unknown as DriverVehicleService;
    const driverPoolService = {
      getAssignedPools: vi.fn().mockResolvedValue([
        {
          id: 'pool-id',
          status: PoolStatus.MATCHING,
          vehicleId: 'bullet-id',
          memberCount: 2,
        },
      ]),
    } as unknown as DriverPoolService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
    );

    await expect(
      controller.getAssignedPools({
        id: 'jashim-id',
        name: 'Jashim',
        email: 'jashim@example.com',
        role: UserRole.DRIVER,
      }),
    ).resolves.toEqual([
      {
        id: 'pool-id',
        status: PoolStatus.MATCHING,
        vehicleId: 'bullet-id',
        memberCount: 2,
      },
    ]);

    expect(driverPoolService.getAssignedPools).toHaveBeenCalledWith(
      'jashim-id',
    );
  });

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
    const driverPoolService = {
      getAssignedPools: vi.fn(),
    } as unknown as DriverPoolService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
    );

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
