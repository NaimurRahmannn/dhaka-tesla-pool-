import { RoutingService } from './routing.service.js';
import type { RouteResult } from './interfaces/route-result.interface.js';
import type { RoutingClient } from './interfaces/routing-client.interface.js';
import { RouteRequestDto } from './dto/route-request.dto.js';

describe('RoutingService', () => {
  it('depends on RoutingClient and returns its provider-neutral route result', async () => {
    const routeResult: RouteResult = {
      distanceMeter: 5000,
      durationSecond: 900,
      geometry: {},
    };
    const client: RoutingClient = {
      getRoute: vi.fn().mockResolvedValue(routeResult),
    };
    const service = new RoutingService(client);
    const request = new RouteRequestDto(23.7937, 90.4066, 23.7806, 90.4071);

    await expect(service.getRoute(request)).resolves.toEqual(routeResult);
    expect(client.getRoute).toHaveBeenCalledWith(request);
  });
});
