import { ROLES_KEY } from '../auth/auth.constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  PoolStatus,
  RideStatus,
  UserRole,
  VehicleStatus,
} from '../generated/prisma/client.js';
import { DriverController } from './driver.controller.js';
import type { DriverPoolService } from './driver-pool.service.js';
import type { DriverRideService } from './driver-ride.service.js';
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
      Reflect.getMetadata(
        ROLES_KEY,
        DriverController.prototype.getAssignedPools,
      ),
    ).toEqual([UserRole.DRIVER]);
  });

  it.each([
    ['arriveAtRide', DriverController.prototype.arriveAtRide],
    ['startRide', DriverController.prototype.startRide],
    ['completeRide', DriverController.prototype.completeRide],
  ])(
    'protects %s with JWT authentication and driver role metadata',
    (_name, handler) => {
      const guards = Reflect.getMetadata(
        '__guards__',
        handler,
      ) as Array<new (...args: never[]) => unknown>;

      expect(guards).toContain(JwtAuthGuard);
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        UserRole.DRIVER,
      ]);
    },
  );

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
    const driverRideService = {
      transitionAssignedRide: vi.fn(),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
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

  it.each([
    ['arriveAtRide', RideStatus.DRIVER_ARRIVED],
    ['startRide', RideStatus.STARTED],
    ['completeRide', RideStatus.COMPLETED],
  ] as const)(
    'uses the authenticated driver id when %s transitions a ride',
    async (methodName, nextStatus) => {
      const driverVehicleService = {
        updateVehicleStatus: vi.fn(),
      } as unknown as DriverVehicleService;
      const driverPoolService = {
        getAssignedPools: vi.fn(),
      } as unknown as DriverPoolService;
      const driverRideService = {
        transitionAssignedRide: vi.fn().mockResolvedValue({
          id: 'ride-id',
          status: nextStatus,
        }),
      } as unknown as DriverRideService;
      const controller = new DriverController(
        driverVehicleService,
        driverPoolService,
        driverRideService,
      );

      await expect(
        controller[methodName]('ride-id', {
          id: 'jashim-id',
          name: 'Jashim',
          email: 'jashim@example.com',
          role: UserRole.DRIVER,
        }),
      ).resolves.toEqual({
        id: 'ride-id',
        status: nextStatus,
      });

      expect(driverRideService.transitionAssignedRide).toHaveBeenCalledWith(
        'jashim-id',
        'ride-id',
        nextStatus,
      );
    },
  );

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
    const driverRideService = {
      transitionAssignedRide: vi.fn(),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
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
