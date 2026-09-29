import { RoutingService } from './routing.service.js';
import type { RouteResult } from './interfaces/route-result.interface.js';
import type { RoutingClient } from './interfaces/routing-client.interface.js';
import { RouteRequestDto } from './dto/route-request.dto.js';
import type { RouteWaypoint } from './interfaces/route-waypoint.interface.js';

describe('RoutingService', () => {
  it('depends on RoutingClient and returns its provider-neutral route result', async () => {
    const routeResult: RouteResult = {
      distanceMeter: 5000,
      durationSecond: 900,
      geometry: {},
    };
    const client: RoutingClient = {
      getRoute: vi.fn().mockResolvedValue(routeResult),
      getRouteThroughWaypoints: vi.fn().mockResolvedValue(routeResult),
    };
    const service = new RoutingService(client);
    const request = new RouteRequestDto(23.7937, 90.4066, 23.7806, 90.4071);

    await expect(service.getRoute(request)).resolves.toEqual(routeResult);
    expect(client.getRoute).toHaveBeenCalledWith(request);
  });

  it('delegates combined waypoint route calculation to RoutingClient', async () => {
    const routeResult: RouteResult = {
      distanceMeter: 12000,
      durationSecond: 1500,
      geometry: {},
    };
    const client: RoutingClient = {
      getRoute: vi.fn(),
      getRouteThroughWaypoints: vi.fn().mockResolvedValue(routeResult),
    };
    const service = new RoutingService(client);
    const waypoints: RouteWaypoint[] = [
      { lat: 23.7937, lng: 90.4066 },
      { lat: 23.7806, lng: 90.4071 },
      { lat: 23.781, lng: 90.413 },
    ];

    await expect(service.getRouteThroughWaypoints(waypoints)).resolves.toEqual(
      routeResult,
    );
    expect(client.getRouteThroughWaypoints).toHaveBeenCalledWith(waypoints);
  });
});
