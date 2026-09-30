"use client";

import { useCallback, useState } from "react";
import {
  arriveRide as arriveRideApi,
  completeRide as completeRideApi,
  startRide as startRideApi,
} from "../api/driver-api";
import type { DriverRide, RideStatus } from "../types/driver.types";

export function useDriverRide(
  rideId: string,
  initialStatus: RideStatus = "MATCHED",
) {
  const [status, setStatus] = useState<RideStatus>(initialStatus);
  const [ride, setRide] = useState<DriverRide | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const arrive = useCallback(async (): Promise<DriverRide> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await arriveRideApi(rideId);
      setStatus(result.status);
      setRide(result);
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to record driver arrival";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [rideId]);

  const start = useCallback(async (): Promise<DriverRide> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await startRideApi(rideId);
      setStatus(result.status);
      setRide(result);
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to start ride";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [rideId]);

  const complete = useCallback(async (): Promise<DriverRide> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await completeRideApi(rideId);
      setStatus(result.status);
      setRide(result);
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to complete ride";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [rideId]);

  return {
    status,
    setStatus,
    ride,
    errorMessage,
    isSubmitting,
    arrive,
    start,
    complete,
  };
}
