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
    ['getAssignedRides', DriverController.prototype.getAssignedRides],
    ['getCompletedRides', DriverController.prototype.getCompletedRides],
    ['getNearbyRides', DriverController.prototype.getNearbyRides],
    ['autoAssign', DriverController.prototype.autoAssign],
    ['acceptRide', DriverController.prototype.acceptRide],
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

  it('protects vehicle retrieval with JWT authentication and driver role metadata', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      DriverController.prototype.getVehicles,
    ) as Array<new (...args: never[]) => unknown>;

    expect(guards).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        DriverController.prototype.getVehicles,
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

  it('uses the authenticated driver id when retrieving driver vehicles', async () => {
    const driverVehicleService = {
      getDriverVehicles: vi.fn().mockResolvedValue([
        {
          id: 'bullet-id',
          driverId: 'jashim-id',
          name: 'Bullet',
          capacity: 3,
          status: VehicleStatus.OFFLINE,
        },
      ]),
    } as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {} as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    await expect(
      controller.getVehicles({
        id: 'jashim-id',
        name: 'Jashim',
        email: 'jashim@example.com',
        role: UserRole.DRIVER,
      }),
    ).resolves.toEqual([
      {
        id: 'bullet-id',
        driverId: 'jashim-id',
        name: 'Bullet',
        capacity: 3,
        status: VehicleStatus.OFFLINE,
      },
    ]);

    expect(driverVehicleService.getDriverVehicles).toHaveBeenCalledWith(
      'jashim-id',
    );
  });

  it('delegates assigned ride retrieval to DriverRideService', async () => {
    const driverVehicleService = {} as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {
      getAssignedRides: vi.fn().mockResolvedValue([
        {
          id: 'ride-1',
          passengerId: 'p-1',
          passengerName: 'Nusrat',
          status: RideStatus.MATCHED,
        },
      ]),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    const result = await controller.getAssignedRides({
      id: 'jashim-id',
      name: 'Jashim',
      email: 'jashim@example.com',
      role: UserRole.DRIVER,
    });

    expect(result).toHaveLength(1);
    expect(driverRideService.getAssignedRides).toHaveBeenCalledWith('jashim-id');
  });

  it('delegates completed ride retrieval to DriverRideService', async () => {
    const driverVehicleService = {} as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {
      getCompletedRides: vi.fn().mockResolvedValue([
        {
          id: 'ride-1',
          passengerId: 'p-1',
          passengerName: 'Nusrat',
          status: RideStatus.COMPLETED,
        },
      ]),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    const result = await controller.getCompletedRides({
      id: 'jashim-id',
      name: 'Jashim',
      email: 'jashim@example.com',
      role: UserRole.DRIVER,
    });

    expect(result).toHaveLength(1);
    expect(driverRideService.getCompletedRides).toHaveBeenCalledWith('jashim-id');
  });

  it('delegates nearby ride retrieval with coordinate parsing', async () => {
    const driverVehicleService = {} as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {
      getNearbyRides: vi.fn().mockResolvedValue([]),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    await controller.getNearbyRides(
      '23.7937',
      '90.4043',
      '2500',
      {
        id: 'jashim-id',
        name: 'Jashim',
        email: 'jashim@example.com',
        role: UserRole.DRIVER,
      },
    );

    expect(driverRideService.getNearbyRides).toHaveBeenCalledWith(
      'jashim-id',
      23.7937,
      90.4043,
      2500,
    );
  });

  it('delegates auto-assigning closest ride', async () => {
    const driverVehicleService = {} as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {
      autoAssignClosestRide: vi.fn().mockResolvedValue({
        id: 'ride-1',
        status: RideStatus.MATCHED,
        distanceMeter: 450,
      }),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    const result = await controller.autoAssign(
      { lat: 23.7937, lng: 90.4043 },
      {
        id: 'jashim-id',
        name: 'Jashim',
        email: 'jashim@example.com',
        role: UserRole.DRIVER,
      },
    );

    expect(result.status).toBe(RideStatus.MATCHED);
    expect(driverRideService.autoAssignClosestRide).toHaveBeenCalledWith(
      'jashim-id',
      23.7937,
      90.4043,
      3000,
    );
  });

  it('delegates ride acceptance to DriverRideService', async () => {
    const driverVehicleService = {} as unknown as DriverVehicleService;
    const driverPoolService = {} as unknown as DriverPoolService;
    const driverRideService = {
      acceptRide: vi.fn().mockResolvedValue({
        id: 'ride-1',
        status: RideStatus.MATCHED,
      }),
    } as unknown as DriverRideService;
    const controller = new DriverController(
      driverVehicleService,
      driverPoolService,
      driverRideService,
    );

    const result = await controller.acceptRide('ride-1', {
      id: 'jashim-id',
      name: 'Jashim',
      email: 'jashim@example.com',
      role: UserRole.DRIVER,
    });

    expect(result.status).toBe(RideStatus.MATCHED);
    expect(driverRideService.acceptRide).toHaveBeenCalledWith('jashim-id', 'ride-1');
  });
});
