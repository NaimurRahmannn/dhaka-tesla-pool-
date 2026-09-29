import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RouteRequestDto } from './dto/route-request.dto.js';
import type { RouteResult } from './interfaces/route-result.interface.js';
import type { RouteWaypoint } from './interfaces/route-waypoint.interface.js';
import type { RoutingClient } from './interfaces/routing-client.interface.js';
import { OSRM_REQUEST_TIMEOUT_MS } from './routing.constants.js';

type OsrmRouteResponse = {
  code: unknown;
  routes: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimeoutError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    (typeof error.message === 'string' &&
      error.message.toLowerCase().includes('timeout'))
  );
}

function hasHttpResponse(error: unknown): boolean {
  return isRecord(error) && isRecord(error.response);
}

@Injectable()
export class OsrmClient implements RoutingClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getRoute(request: RouteRequestDto): Promise<RouteResult> {
    return this.requestRoute((baseUrl) => this.buildRouteUrl(baseUrl, request));
  }

  async getRouteThroughWaypoints(
    waypoints: readonly RouteWaypoint[],
  ): Promise<RouteResult> {
    return this.requestRoute((baseUrl) =>
      this.buildWaypointRouteUrl(baseUrl, waypoints),
    );
  }

  private async requestRoute(
    buildUrl: (baseUrl: string) => string,
  ): Promise<RouteResult> {
    const baseUrl = this.configService.get<string>('OSRM_BASE_URL');

    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'Routing provider is not configured',
      );
    }

    const routeUrl = buildUrl(baseUrl);
    let responseData: unknown;

    try {
      const response = await firstValueFrom(
        this.httpService.get<OsrmRouteResponse>(routeUrl, {
          timeout: OSRM_REQUEST_TIMEOUT_MS,
        }),
      );
      responseData = response.data;
    } catch (error: unknown) {
      throw this.toApplicationError(error);
    }

    return this.mapResponse(responseData);
  }

  private buildRouteUrl(baseUrl: string, request: RouteRequestDto): string {
    return `${baseUrl.replace(/\/+$/, '')}/route/v1/driving/${request.pickupLng},${request.pickupLat};${request.destinationLng},${request.destinationLat}`;
  }

  private buildWaypointRouteUrl(
    baseUrl: string,
    waypoints: readonly RouteWaypoint[],
  ): string {
    const coordinates = waypoints
      .map((waypoint) => `${waypoint.lng},${waypoint.lat}`)
      .join(';');

    return `${baseUrl.replace(/\/+$/, '')}/route/v1/driving/${coordinates}`;
  }

  private mapResponse(body: unknown): RouteResult {
    if (!isRecord(body)) {
      throw new BadGatewayException(
        'Routing provider returned an invalid response',
      );
    }

    const response = body as OsrmRouteResponse;
    const routes = response.routes;

    if (
      response.code === 'NoRoute' ||
      (Array.isArray(routes) && !routes.length)
    ) {
      throw new NotFoundException('No route found for the requested coordinates');
    }

    const route = Array.isArray(routes) ? routes[0] : undefined;

    if (
      response.code !== 'Ok' ||
      !isRecord(route) ||
      typeof route.distance !== 'number' ||
      typeof route.duration !== 'number' ||
      !('geometry' in route)
    ) {
      throw new BadGatewayException(
        'Routing provider returned an invalid response',
      );
    }

    return {
      distanceMeter: route.distance,
      durationSecond: route.duration,
      geometry: route.geometry,
    };
  }

  private toApplicationError(error: unknown): Error {
    if (isTimeoutError(error)) {
      return new GatewayTimeoutException('Routing provider timed out');
    }

    if (hasHttpResponse(error)) {
      return new BadGatewayException(
        'Routing provider returned an HTTP error',
      );
    }

    return new ServiceUnavailableException('Routing provider is unavailable');
  }
}
