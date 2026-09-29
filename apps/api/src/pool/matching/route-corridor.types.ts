export interface RouteCandidate {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceMeter: number;
}

export interface RouteCorridorMatchResult {
  compatible: boolean;
  pickupDistanceMeter: number;
  destinationDistanceMeter: number;
  detourPercent: number;
}
