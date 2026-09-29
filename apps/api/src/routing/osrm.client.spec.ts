import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { throwError, of } from 'rxjs';
import { RouteRequestDto } from './dto/route-request.dto.js';
import { OsrmClient } from './osrm.client.js';
import type { RouteWaypoint } from './interfaces/route-waypoint.interface.js';

function createClient(
  response: ReturnType<typeof of> | ReturnType<typeof throwError>,
  baseUrl = 'https://routing.example.test',
) {
  const httpService = {
    get: vi.fn().mockReturnValue(response),
  } as unknown as HttpService;
  const configService = {
    get: vi.fn().mockReturnValue(baseUrl),
  } as unknown as ConfigService;

  return {
    client: new OsrmClient(httpService, configService),
    httpService,
    configService,
  };
}

const request = new RouteRequestDto(23.7937, 90.4066, 23.7806, 90.4071);

describe('OsrmClient', () => {
  it('maps a successful response and sends longitude before latitude', async () => {
    const { client, httpService, configService } = createClient(
      of({
        data: {
          code: 'Ok',
          routes: [
            {
              distance: 5000,
              duration: 900,
              geometry: {},
            },
          ],
        },
      }),
    );

    await expect(client.getRoute(request)).resolves.toEqual({
      distanceMeter: 5000,
      durationSecond: 900,
      geometry: {},
    });

    expect(configService.get).toHaveBeenCalledWith('OSRM_BASE_URL');
    expect(httpService.get).toHaveBeenCalledWith(
      'https://routing.example.test/route/v1/driving/90.4066,23.7937;90.4071,23.7806',
      { timeout: 5000 },
    );
  });

  it('calculates a route through multiple waypoints using longitude before latitude', async () => {
    const { client, httpService } = createClient(
      of({
        data: {
          code: 'Ok',
          routes: [
            {
              distance: 12000,
              duration: 1500,
              geometry: {},
            },
          ],
        },
      }),
    );
    const waypoints: RouteWaypoint[] = [
      { lat: 23.7937, lng: 90.4066 },
      { lat: 23.7806, lng: 90.4071 },
      { lat: 23.781, lng: 90.413 },
    ];

    await expect(client.getRouteThroughWaypoints(waypoints)).resolves.toEqual({
      distanceMeter: 12000,
      durationSecond: 1500,
      geometry: {},
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://routing.example.test/route/v1/driving/90.4066,23.7937;90.4071,23.7806;90.413,23.781',
      { timeout: 5000 },
    );
  });

  it('throws a not-found application error when OSRM returns no route', async () => {
    const { client } = createClient(
      of({
        data: {
          code: 'NoRoute',
          routes: [],
        },
      }),
    );

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps HTTP failures to a bad-gateway application error', async () => {
    const { client } = createClient(
      throwError(() => ({
        response: {
          status: 503,
        },
        message: 'upstream failure',
      })),
    );

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    await expect(client.getRoute(request)).rejects.not.toThrow(
      'upstream failure',
    );
  });

  it('maps provider timeouts to a gateway-timeout application error', async () => {
    const { client } = createClient(
      throwError(() => ({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      })),
    );

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('maps provider unavailability to a service-unavailable application error', async () => {
    const { client } = createClient(
      throwError(() => ({
        code: 'ECONNREFUSED',
        message: 'connect refused',
      })),
    );

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects an invalid OSRM response format', async () => {
    const { client } = createClient(
      of({
        data: {
          code: 'Ok',
          routes: [{ distance: '4200', duration: 780 }],
        },
      }),
    );

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects requests when OSRM_BASE_URL is not configured', async () => {
    const { client } = createClient(of({ data: {} }), '');

    await expect(client.getRoute(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
