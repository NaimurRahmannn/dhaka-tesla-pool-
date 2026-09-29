import type { RouteRequestDto } from '../dto/route-request.dto.js';
import type { RouteResult } from './route-result.interface.js';

export interface RoutingClient {
  getRoute(request: RouteRequestDto): Promise<RouteResult>;
}
