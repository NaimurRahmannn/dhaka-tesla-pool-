"use client";

import { useCallback, useEffect, useState } from "react";
import {
  arriveRide as arriveRideApi,
  completeRide as completeRideApi,
  getAssignedRides as getAssignedRidesApi,
  startRide as startRideApi,
} from "../api/driver-api";
import type { AssignedRide } from "../types/driver.types";

export function useAssignedRides() {
  const [assignedRides, setAssignedRides] = useState<AssignedRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionRideId, setActionRideId] = useState<string | null>(null);

  const refreshAssignedRides = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rides = await getAssignedRidesApi();
      setAssignedRides(rides);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load assigned rides",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getAssignedRidesApi()
      .then((rides) => {
        if (!ignore) {
          setAssignedRides(rides);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load assigned rides",
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
  }, []);

  const arrive = useCallback(
    async (rideId: string) => {
      setActionRideId(rideId);
      setErrorMessage(null);
      try {
        await arriveRideApi(rideId);
        await refreshAssignedRides();
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to record arrival",
        );
        throw error;
      } finally {
        setActionRideId(null);
      }
    },
    [refreshAssignedRides],
  );

  const start = useCallback(
    async (rideId: string) => {
      setActionRideId(rideId);
      setErrorMessage(null);
      try {
        await startRideApi(rideId);
        await refreshAssignedRides();
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to start ride",
        );
        throw error;
      } finally {
        setActionRideId(null);
      }
    },
    [refreshAssignedRides],
  );

  const complete = useCallback(
    async (rideId: string) => {
      setActionRideId(rideId);
      setErrorMessage(null);
      try {
        await completeRideApi(rideId);
        await refreshAssignedRides();
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete ride",
        );
        throw error;
      } finally {
        setActionRideId(null);
      }
    },
    [refreshAssignedRides],
  );

  return {
    assignedRides,
    isLoading,
    errorMessage,
    actionRideId,
    refreshAssignedRides,
    arrive,
    start,
    complete,
  };
}
