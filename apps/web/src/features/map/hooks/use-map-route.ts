"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Coordinates, RoutePreview } from "../types/map.types";

export function isValidCoordinate(
  coord?: Coordinates | null,
): coord is Coordinates {
  if (!coord) return false;
  return (
    typeof coord.lat === "number" &&
    typeof coord.lng === "number" &&
    !Number.isNaN(coord.lat) &&
    !Number.isNaN(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
}

const DEFAULT_OSRM_URL = "https://router.project-osrm.org";

export async function fetchOsrmRoute(
  pickup: Coordinates,
  destination: Coordinates,
  baseUrl?: string,
): Promise<RoutePreview> {
  const osrmBase = (
    baseUrl ||
    process.env.NEXT_PUBLIC_OSRM_URL ||
    DEFAULT_OSRM_URL
  ).replace(/\/+$/, "");

  const url = `${osrmBase}/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Route preview request timed out");
    }
    throw new Error(
      error instanceof Error ? error.message : "Routing API connection failed",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Routing service returned status ${response.status}`);
  }

  const data = await response.json();
  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    data.routes.length === 0
  ) {
    throw new Error("No route found between selected points");
  }

  const primaryRoute = data.routes[0];
  const distanceMeter = Math.round(primaryRoute.distance ?? 0);
  const durationSecond = Math.round(primaryRoute.duration ?? 0);

  // GeoJSON coordinates are [longitude, latitude].
  // Leaflet Polyline expects [latitude, longitude].
  const geojsonCoords: [number, number][] =
    primaryRoute.geometry?.coordinates ?? [];
  const leafletCoordinates: [number, number][] = geojsonCoords.map(
    ([lng, lat]) => [lat, lng],
  );

  const coordinates: [number, number][] =
    leafletCoordinates.length > 0
      ? leafletCoordinates
      : [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ];

  return {
    pickup,
    destination,
    coordinates,
    distanceMeter,
    durationSecond,
    distanceKm: (distanceMeter / 1000).toFixed(1),
    durationMinutes: Math.max(1, Math.round(durationSecond / 60)),
  };
}

export function useMapRoute(
  pickup?: Coordinates | null,
  destination?: Coordinates | null,
) {
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pickupLat = pickup?.lat;
  const pickupLng = pickup?.lng;
  const destLat = destination?.lat;
  const destLng = destination?.lng;

  const validPickup = useMemo(() => {
    return pickupLat !== undefined &&
      pickupLng !== undefined &&
      isValidCoordinate({ lat: pickupLat, lng: pickupLng })
      ? { lat: pickupLat, lng: pickupLng }
      : null;
  }, [pickupLat, pickupLng]);

  const validDestination = useMemo(() => {
    return destLat !== undefined &&
      destLng !== undefined &&
      isValidCoordinate({ lat: destLat, lng: destLng })
      ? { lat: destLat, lng: destLng }
      : null;
  }, [destLat, destLng]);

  const fetchRoute = useCallback(async () => {
    if (!validPickup || !validDestination) {
      setRoute(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    if (
      validPickup.lat === validDestination.lat &&
      validPickup.lng === validDestination.lng
    ) {
      setRoute(null);
      setErrorMessage("Pickup and destination cannot be the same point");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchOsrmRoute(validPickup, validDestination);
      setRoute(result);
    } catch (error: unknown) {
      setRoute(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Route unavailable",
      );
    } finally {
      setIsLoading(false);
    }
  }, [validPickup, validDestination]);

  useEffect(() => {
    let ignore = false;

    if (!validPickup || !validDestination) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setRoute(null);
          setErrorMessage(null);
          setIsLoading(false);
        }
      });
      return () => {
        ignore = true;
      };
    }

    if (
      validPickup.lat === validDestination.lat &&
      validPickup.lng === validDestination.lng
    ) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setRoute(null);
          setErrorMessage("Pickup and destination cannot be the same point");
          setIsLoading(false);
        }
      });
      return () => {
        ignore = true;
      };
    }

    Promise.resolve().then(() => {
      if (!ignore) {
        setIsLoading(true);
        setErrorMessage(null);
      }
    });

    fetchOsrmRoute(validPickup, validDestination)
      .then((result) => {
        if (!ignore) {
          setRoute(result);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setRoute(null);
          setErrorMessage(
            error instanceof Error ? error.message : "Route unavailable",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [validPickup, validDestination]);

  return {
    route,
    isLoading,
    errorMessage,
    refetch: fetchRoute,
  };
}
