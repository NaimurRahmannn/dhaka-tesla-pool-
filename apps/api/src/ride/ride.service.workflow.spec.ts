import { Test, TestingModule } from '@nestjs/testing';
import { RideStatus } from '../generated/prisma/client.js';
import { CalculateFareDto } from '../fare/dto/calculate-fare.dto.js';
import type { FareBreakdown } from '../fare/interfaces/fare-breakdown.interface.js';
import { FareService } from '../fare/fare.service.js';
import type { RouteRequestDto } from '../routing/dto/route-request.dto.js';
import type { RouteResult } from '../routing/interfaces/route-result.interface.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { CreateRideRequestDto } from './dto/create-ride-request.dto.js';
import { RideService } from './ride.service.js';
import { RideTransitionService } from './ride-transition.service.js';

type TransactionData = {
  rideRequests: Array<Record<string, unknown>>;
  routeSnapshots: Array<Record<string, unknown>>;
  statusHistory: Array<Record<string, unknown>>;
};

function createPrismaMock(failOn?: keyof TransactionData) {
  const committed: TransactionData = {
    rideRequests: [],
    routeSnapshots: [],
    statusHistory: [],
  };

  const prisma = {
    $transaction: vi.fn(
      async (
        callback: (transaction: unknown) => Promise<unknown>,
      ): Promise<unknown> => {
        const staged: TransactionData = {
          rideRequests: [],
          routeSnapshots: [],
          statusHistory: [],
        };

        const create = (
          key: keyof TransactionData,
          result: Record<string, unknown>,
        ) =>
          vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            if (failOn === key) {
              throw new Error(`${key} create failed`);
            }

            staged[key].push(data);
            return result;
          });

        const transaction = {
          rideRequest: {
            create: create('rideRequests', {
              id: 'ride-request-id',
              status: RideStatus.REQUESTED,
            }),
          },
          routeSnapshot: {
            create: create('routeSnapshots', { id: 'route-snapshot-id' }),
          },
          rideStatusHistory: {
            create: create('statusHistory', { id: 'history-id' }),
          },
        };

        const result = await callback(transaction);

        committed.rideRequests.push(...staged.rideRequests);
        committed.routeSnapshots.push(...staged.routeSnapshots);
        committed.statusHistory.push(...staged.statusHistory);

        return result;
      },
    ),
  } as unknown as PrismaService;

  return { prisma, committed };
}

const request = new CreateRideRequestDto(23.7937, 90.4066, 23.7806, 90.4071);
const passengerId = 'passenger-id';
const routeResult: RouteResult = {
  distanceMeter: 5000,
  durationSecond: 900,
  geometry: { type: 'LineString', coordinates: [] },
};
const fareBreakdown: FareBreakdown = {
  baseFarePaisa: 2000,
  distanceChargePaisa: 2500,
  subtotalPaisa: 4500,
  poolDiscountPaisa: 0,
  finalFarePaisa: 4500,
};

function createModule(
  prisma: PrismaService,
  routingService: RoutingService,
  fareService: FareService,
) {
  return Test.createTestingModule({
    providers: [
      RideService,
      { provide: PrismaService, useValue: prisma },
      { provide: RoutingService, useValue: routingService },
      { provide: FareService, useValue: fareService },
      { provide: RideTransitionService, useValue: {} },
    ],
  });
}

describe('RideService ride creation workflow', () => {
  let module: TestingModule;
  let rideService: RideService;
  let routingService: { getRoute: ReturnType<typeof vi.fn> };
  let fareService: { calculateFare: ReturnType<typeof vi.fn> };
  let committed: TransactionData;

  beforeEach(async () => {
    routingService = {
      getRoute: vi.fn().mockResolvedValue(routeResult),
    };
    fareService = {
      calculateFare: vi.fn().mockReturnValue(fareBreakdown),
    };

    const transaction = createPrismaMock();
    committed = transaction.committed;
    module = await createModule(
      transaction.prisma,
      routingService as unknown as RoutingService,
      fareService as unknown as FareService,
    ).compile();
    rideService = module.get(RideService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('creates a ride, route snapshot, and initial status history in one transaction', async () => {
    const result = await rideService.createRideRequest(request, passengerId);

    expect(result).toEqual({
      id: 'ride-request-id',
      status: RideStatus.REQUESTED,
    });
    expect(committed.rideRequests[0]).toMatchObject({
      passengerId,
      pickupLat: request.pickupLat,
      pickupLng: request.pickupLng,
      destinationLat: request.destinationLat,
      destinationLng: request.destinationLng,
      status: RideStatus.REQUESTED,
      estimatedFarePaisa: fareBreakdown.finalFarePaisa,
    });
    expect(committed.routeSnapshots[0]).toEqual({
      rideRequestId: 'ride-request-id',
      distanceMeter: routeResult.distanceMeter,
      durationSecond: routeResult.durationSecond,
      geometry: routeResult.geometry,
    });
    expect(committed.statusHistory[0]).toEqual({
      rideRequestId: 'ride-request-id',
      previousStatus: null,
      newStatus: RideStatus.REQUESTED,
      changedBy: passengerId,
    });
    expect(routingService.getRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng,
        destinationLat: request.destinationLat,
        destinationLng: request.destinationLng,
      } satisfies Partial<RouteRequestDto>),
    );
    expect(fareService.calculateFare).toHaveBeenCalledWith(
      new CalculateFareDto(routeResult.distanceMeter, false),
    );
  });

  it('stores the authenticated passenger as the ride owner and history actor', async () => {
    const { prisma, committed } = createPrismaMock();
    const isolatedModule = await createModule(
      prisma,
      routingService as unknown as RoutingService,
      fareService as unknown as FareService,
    ).compile();

    await isolatedModule.get(RideService).createRideRequest(request, passengerId);

    expect(committed.rideRequests[0]).toMatchObject({
      passengerId,
      status: RideStatus.REQUESTED,
    });
    expect(committed.statusHistory[0]).toMatchObject({
      rideRequestId: 'ride-request-id',
      previousStatus: null,
      newStatus: RideStatus.REQUESTED,
      changedBy: passengerId,
    });

    await isolatedModule.close();
  });

  it('does not start a transaction when routing fails', async () => {
    const { prisma, committed } = createPrismaMock();
    const failingRoutingService = {
      getRoute: vi.fn().mockRejectedValue(new Error('routing failed')),
    };
    const isolatedModule = await createModule(
      prisma,
      failingRoutingService as unknown as RoutingService,
      fareService as unknown as FareService,
    ).compile();

    await expect(
      isolatedModule.get(RideService).createRideRequest(request, passengerId),
    ).rejects.toThrow('routing failed');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(committed).toEqual({
      rideRequests: [],
      routeSnapshots: [],
      statusHistory: [],
    });

    await isolatedModule.close();
  });

  it('does not start a transaction when fare calculation fails', async () => {
    const { prisma, committed } = createPrismaMock();
    const failingFareService = {
      calculateFare: vi.fn().mockImplementation(() => {
        throw new Error('fare failed');
      }),
    };
    const isolatedModule = await createModule(
      prisma,
      routingService as unknown as RoutingService,
      failingFareService as unknown as FareService,
    ).compile();

    await expect(
      isolatedModule.get(RideService).createRideRequest(request, passengerId),
    ).rejects.toThrow('fare failed');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(committed).toEqual({
      rideRequests: [],
      routeSnapshots: [],
      statusHistory: [],
    });

    await isolatedModule.close();
  });

  it('does not commit partial records when a transaction create fails', async () => {
    const { prisma, committed } = createPrismaMock('routeSnapshots');
    const isolatedModule = await createModule(
      prisma,
      routingService as unknown as RoutingService,
      fareService as unknown as FareService,
    ).compile();

    await expect(
      isolatedModule.get(RideService).createRideRequest(request, passengerId),
    ).rejects.toThrow('routeSnapshots create failed');

    expect(committed).toEqual({
      rideRequests: [],
      routeSnapshots: [],
      statusHistory: [],
    });

    await isolatedModule.close();
  });
});
