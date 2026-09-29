import { Injectable } from '@nestjs/common';
import type { RouteRequestDto } from './dto/route-request.dto.js';
import type { RouteResult } from './interfaces/route-result.interface.js';
import type { RoutingClient } from './interfaces/routing-client.interface.js';

type OsrmRouteResponse = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class OsrmClient implements RoutingClient {
  async getRoute(request: RouteRequestDto): Promise<RouteResult> {
    const baseUrl = process.env.OSRM_BASE_URL;

    if (!baseUrl) {
      throw new Error('OSRM_BASE_URL is required to request a route');
    }

    const routeUrl = new URL(
      `${baseUrl.replace(/\/+$/, '')}/route/v1/driving/${request.pickupLng},${request.pickupLat};${request.destinationLng},${request.destinationLat}`,
    );
    routeUrl.searchParams.set('overview', 'full');
    routeUrl.searchParams.set('geometries', 'geojson');

    const response = await fetch(routeUrl);

    if (!response.ok) {
      throw new Error(`OSRM request failed with status ${response.status}`);
    }

    const body = (await response.json()) as unknown;
    const route = this.getRouteFromResponse(body);

    return {
      distanceMeter: route.distance,
      durationSecond: route.duration,
      geometry: route.geometry,
    };
  }

  private getRouteFromResponse(body: unknown): {
    distance: number;
    duration: number;
    geometry: unknown;
  } {
    if (!isRecord(body)) {
      throw new Error('OSRM response did not contain a usable route');
    }

    const response: OsrmRouteResponse = body;
    const routes = response.routes;
    const route = Array.isArray(routes) ? routes[0] : undefined;

    if (
      response.code !== 'Ok' ||
      !isRecord(route) ||
      typeof route.distance !== 'number' ||
      typeof route.duration !== 'number' ||
      !('geometry' in route)
    ) {
      throw new Error('OSRM response did not contain a usable route');
    }

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
    };
  }
}
