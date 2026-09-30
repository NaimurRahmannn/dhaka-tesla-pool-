export type Coordinates = {
  lat: number;
  lng: number;
};

export type MapLocation = {
  coordinates: Coordinates;
  label?: string;
  address?: string;
};

export type RoutePreview = {
  pickup: Coordinates;
  destination: Coordinates;
  coordinates: [number, number][]; // Array of [lat, lng] points for Leaflet Polyline
  distanceMeter: number;
  durationSecond: number;
  distanceKm?: string;
  durationMinutes?: number;
};
