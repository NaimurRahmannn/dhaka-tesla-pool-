"use client";

import { useCallback, useEffect, useState } from "react";
import { getCompletedRides as getCompletedRidesApi } from "../api/driver-api";
import type { AssignedRide } from "../types/driver.types";

export function useCompletedRides() {
  const [completedRides, setCompletedRides] = useState<AssignedRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshCompletedRides = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rides = await getCompletedRidesApi();
      setCompletedRides(rides);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load completed rides",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getCompletedRidesApi()
      .then((rides) => {
        if (!ignore) {
          setCompletedRides(rides);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load completed rides",
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

  return {
    completedRides,
    isLoading,
    errorMessage,
    refreshCompletedRides,
  };
}
