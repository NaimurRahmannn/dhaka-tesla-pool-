"use client";

import { useCallback, useEffect, useState } from "react";
import { getRides } from "../api/passenger-api";
import type { Ride } from "../types/passenger.types";

export function usePassengerRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getRides();
      setRides(data);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load rides",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getRides()
      .then((data) => {
        if (!ignore) {
          setRides(data);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load rides",
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
    rides,
    errorMessage,
    isLoading,
    refetch: fetchRides,
  };
}
