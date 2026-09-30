"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelRide as cancelRideApi, getRide } from "../api/passenger-api";
import type { Ride, RideMutationResult } from "../types/passenger.types";

export function useRide(rideId: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchRide = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getRide(rideId);
      setRide(data);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load ride",
      );
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    let ignore = false;

    getRide(rideId)
      .then((data) => {
        if (!ignore) {
          setRide(data);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load ride",
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
  }, [rideId]);

  const cancel = useCallback(async (): Promise<RideMutationResult> => {
    setErrorMessage(null);
    setIsCancelling(true);
    try {
      const result = await cancelRideApi(rideId);
      setRide((current) =>
        current ? { ...current, status: result.status } : current,
      );
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not cancel ride";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  }, [rideId]);

  return {
    ride,
    errorMessage,
    isLoading,
    isCancelling,
    cancel,
    refetch: fetchRide,
  };
}
