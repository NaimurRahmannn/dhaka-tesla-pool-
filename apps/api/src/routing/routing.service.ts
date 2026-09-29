import { Inject, Injectable } from '@nestjs/common';
import { ROUTING_CLIENT } from './routing.constants.js';
import type { RouteRequestDto } from './dto/route-request.dto.js';
import type { RouteResult } from './interfaces/route-result.interface.js';
import type { RoutingClient } from './interfaces/routing-client.interface.js';

@Injectable()
export class RoutingService {
  constructor(
    @Inject(ROUTING_CLIENT) private readonly routingClient: RoutingClient,
  ) {}

  getRoute(request: RouteRequestDto): Promise<RouteResult> {
    return this.routingClient.getRoute(request);
  }
}
