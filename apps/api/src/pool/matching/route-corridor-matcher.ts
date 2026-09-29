import {
  MAX_DESTINATION_DISTANCE_METER,
  MAX_DETOUR_PERCENT,
  MAX_PICKUP_DISTANCE_METER,
} from './route-corridor.constants.js';
import type {
  RouteCandidate,
  RouteCorridorMatchResult,
} from './route-corridor.types.js';

const EARTH_RADIUS_METER = 6371000;

export class RouteCorridorMatcher {
  match(
    existingRoute: RouteCandidate,
    candidateRoute: RouteCandidate,
    sharedRouteDistanceMeter: number,
  ): RouteCorridorMatchResult {
    const pickupDistanceMeter = calculateHaversineDistanceMeter(
      existingRoute.pickupLat,
      existingRoute.pickupLng,
      candidateRoute.pickupLat,
      candidateRoute.pickupLng,
    );
    const destinationDistanceMeter = calculateHaversineDistanceMeter(
      existingRoute.destinationLat,
      existingRoute.destinationLng,
      candidateRoute.destinationLat,
      candidateRoute.destinationLng,
    );
    const detourPercent = calculateMaxDetourPercent(
      existingRoute.distanceMeter,
      candidateRoute.distanceMeter,
      sharedRouteDistanceMeter,
    );

    return {
      compatible:
        pickupDistanceMeter <= MAX_PICKUP_DISTANCE_METER &&
        destinationDistanceMeter <= MAX_DESTINATION_DISTANCE_METER &&
        detourPercent <= MAX_DETOUR_PERCENT,
      pickupDistanceMeter,
      destinationDistanceMeter,
      detourPercent,
    };
  }
}

function calculateMaxDetourPercent(
  existingSoloDistanceMeter: number,
  candidateSoloDistanceMeter: number,
  sharedRouteDistanceMeter: number,
): number {
  return Math.max(
    calculateDetourPercent(existingSoloDistanceMeter, sharedRouteDistanceMeter),
    calculateDetourPercent(candidateSoloDistanceMeter, sharedRouteDistanceMeter),
  );
}

function calculateDetourPercent(
  soloRouteDistanceMeter: number,
  sharedRouteDistanceMeter: number,
): number {
  if (soloRouteDistanceMeter === 0) {
    return sharedRouteDistanceMeter === 0 ? 0 : Number.POSITIVE_INFINITY;
  }

  return roundMeasurement(
    ((sharedRouteDistanceMeter - soloRouteDistanceMeter) /
      soloRouteDistanceMeter) *
      100,
  );
}

function calculateHaversineDistanceMeter(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadian = toRadians(firstLatitude);
  const secondLatitudeRadian = toRadians(secondLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadian) *
      Math.cos(secondLatitudeRadian) *
      Math.sin(longitudeDelta / 2) ** 2;

  return roundMeasurement(
    2 *
      EARTH_RADIUS_METER *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function toRadians(degree: number): number {
  return (degree * Math.PI) / 180;
}

function roundMeasurement(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}
