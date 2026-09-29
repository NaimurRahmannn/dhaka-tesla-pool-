import { describe, expect, it } from 'vitest';
import { RouteCorridorMatcher } from './route-corridor-matcher.js';
import type { RouteCandidate } from './route-corridor.types.js';

const EARTH_RADIUS_METER = 6371000;

const baseRoute: RouteCandidate = {
  pickupLat: 23.7806,
  pickupLng: 90.4074,
  destinationLat: 23.8103,
  destinationLng: 90.4125,
  distanceMeter: 10000,
};

const nearbyRoute: RouteCandidate = {
  pickupLat: 23.781,
  pickupLng: 90.4077,
  destinationLat: 23.811,
  destinationLng: 90.413,
  distanceMeter: 10000,
};

function moveNorth(latitude: number, meter: number): number {
  return latitude + (meter / EARTH_RADIUS_METER) * (180 / Math.PI);
}

function routeWithPickupDistance(meter: number): RouteCandidate {
  return {
    ...nearbyRoute,
    pickupLat: moveNorth(baseRoute.pickupLat, meter),
    pickupLng: baseRoute.pickupLng,
  };
}

function routeWithDestinationDistance(meter: number): RouteCandidate {
  return {
    ...nearbyRoute,
    destinationLat: moveNorth(baseRoute.destinationLat, meter),
    destinationLng: baseRoute.destinationLng,
  };
}

describe('RouteCorridorMatcher', () => {
  const matcher = new RouteCorridorMatcher();

  it('marks routes compatible when pickup, destination, and detour rules pass', () => {
    const result = matcher.match(baseRoute, nearbyRoute, 12000);

    expect(result.compatible).toBe(true);
    expect(result.pickupDistanceMeter).toBeLessThanOrEqual(2000);
    expect(result.destinationDistanceMeter).toBeLessThanOrEqual(3000);
    expect(result.detourPercent).toBe(20);
  });

  it('rejects routes when pickup distance is too large', () => {
    const result = matcher.match(baseRoute, routeWithPickupDistance(2001), 12000);

    expect(result.compatible).toBe(false);
    expect(result.pickupDistanceMeter).toBeGreaterThan(2000);
  });

  it('rejects routes when destination distance is too large', () => {
    const result = matcher.match(
      baseRoute,
      routeWithDestinationDistance(3001),
      12000,
    );

    expect(result.compatible).toBe(false);
    expect(result.destinationDistanceMeter).toBeGreaterThan(3000);
  });

  it('rejects routes when detour is too large', () => {
    const result = matcher.match(baseRoute, nearbyRoute, 13001);

    expect(result.compatible).toBe(false);
    expect(result.detourPercent).toBeGreaterThan(30);
  });

  it('allows pickup distance at the configured boundary', () => {
    const result = matcher.match(baseRoute, routeWithPickupDistance(2000), 12000);

    expect(result.compatible).toBe(true);
    expect(result.pickupDistanceMeter).toBeLessThanOrEqual(2000);
  });

  it('rejects pickup distance beyond the configured boundary', () => {
    const result = matcher.match(baseRoute, routeWithPickupDistance(2001), 12000);

    expect(result.compatible).toBe(false);
    expect(result.pickupDistanceMeter).toBeGreaterThan(2000);
  });

  it('allows destination distance at the configured boundary', () => {
    const result = matcher.match(
      baseRoute,
      routeWithDestinationDistance(3000),
      12000,
    );

    expect(result.compatible).toBe(true);
    expect(result.destinationDistanceMeter).toBeLessThanOrEqual(3000);
  });

  it('rejects destination distance beyond the configured boundary', () => {
    const result = matcher.match(
      baseRoute,
      routeWithDestinationDistance(3001),
      12000,
    );

    expect(result.compatible).toBe(false);
    expect(result.destinationDistanceMeter).toBeGreaterThan(3000);
  });

  it('allows detour at the configured boundary', () => {
    const result = matcher.match(baseRoute, nearbyRoute, 13000);

    expect(result.compatible).toBe(true);
    expect(result.detourPercent).toBe(30);
  });

  it('rejects detour beyond the configured boundary', () => {
    const result = matcher.match(baseRoute, nearbyRoute, 13001);

    expect(result.compatible).toBe(false);
    expect(result.detourPercent).toBeGreaterThan(30);
  });
});
