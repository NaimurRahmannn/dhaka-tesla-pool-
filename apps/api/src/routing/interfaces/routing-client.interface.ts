import type { RouteRequestDto } from '../dto/route-request.dto.js';
import type { RouteResult } from './route-result.interface.js';
import type { RouteWaypoint } from './route-waypoint.interface.js';

export interface RoutingClient {
  getRoute(request: RouteRequestDto): Promise<RouteResult>;
  getRouteThroughWaypoints(
    waypoints: readonly RouteWaypoint[],
  ): Promise<RouteResult>;
}
