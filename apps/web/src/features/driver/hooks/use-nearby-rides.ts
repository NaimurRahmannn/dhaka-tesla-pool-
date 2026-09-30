"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptRide as acceptRideApi,
  autoAssignClosestRide as autoAssignClosestRideApi,
  getNearbyRides as getNearbyRidesApi,
} from "../api/driver-api";
import type { NearbyRide } from "../types/driver.types";

export function useNearbyRides({
  lat,
  lng,
  isOnline,
  radius = 3000,
}: {
  lat?: number | null;
  lng?: number | null;
  isOnline: boolean;
  radius?: number;
}) {
  const [nearbyRides, setNearbyRides] = useState<NearbyRide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshNearbyRides = useCallback(async () => {
    if (!isOnline || lat == null || lng == null) {
      setNearbyRides([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rides = await getNearbyRidesApi(lat, lng, radius);
      setNearbyRides(rides);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load nearby rides",
      );
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng, isOnline, radius]);

  useEffect(() => {
    if (!isOnline || lat == null || lng == null) {
      return;
    }

    let ignore = false;

    getNearbyRidesApi(lat, lng, radius)
      .then((rides) => {
        if (!ignore) {
          setNearbyRides(rides);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load nearby rides",
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
  }, [lat, lng, isOnline, radius]);

  const accept = useCallback(
    async (rideId: string) => {
      setIsAssigning(true);
      setErrorMessage(null);
      try {
        const result = await acceptRideApi(rideId);
        await refreshNearbyRides();
        return result;
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to accept ride",
        );
        throw error;
      } finally {
        setIsAssigning(false);
      }
    },
    [refreshNearbyRides],
  );

  const autoAssign = useCallback(async () => {
    if (lat == null || lng == null) {
      setErrorMessage("Current driver location is required for auto-assignment");
      return null;
    }

    setIsAssigning(true);
    setErrorMessage(null);
    try {
      const result = await autoAssignClosestRideApi(lat, lng, radius);
      await refreshNearbyRides();
      return result;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to auto-assign ride",
      );
      throw error;
    } finally {
      setIsAssigning(false);
    }
  }, [lat, lng, radius, refreshNearbyRides]);

  return {
    nearbyRides,
    isLoading,
    isAssigning,
    errorMessage,
    refreshNearbyRides,
    accept,
    autoAssign,
  };
}
