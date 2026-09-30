"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDriverVehicles,
  updateVehicleStatus as updateVehicleStatusApi,
} from "../api/driver-api";
import type { DriverVehicle, VehicleStatus } from "../types/driver.types";

export function useVehicleStatus(
  initialVehicleId?: string,
  initialStatus: VehicleStatus = "OFFLINE",
) {
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? "");
  const [status, setStatus] = useState<VehicleStatus>(initialStatus);
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialVehicleId) {
      return;
    }

    let isMounted = true;
    async function loadVehicle() {
      if (typeof getDriverVehicles !== "function") return;
      setIsLoading(true);
      try {
        const vehicles = await getDriverVehicles();
        if (isMounted && vehicles && vehicles.length > 0) {
          setVehicleId(vehicles[0].id);
          setStatus(vehicles[0].status);
          setVehicle(vehicles[0]);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load vehicle",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVehicle();
    return () => {
      isMounted = false;
    };
  }, [initialVehicleId]);

  const updateStatus = useCallback(
    async (nextStatus: VehicleStatus, targetVehicleId?: string): Promise<DriverVehicle> => {
      const idToUpdate = targetVehicleId || vehicleId;
      setIsUpdating(true);
      setErrorMessage(null);
      try {
        const result = await updateVehicleStatusApi(idToUpdate, nextStatus);
        setStatus(result.status);
        setVehicle(result);
        return result;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update vehicle status";
        setErrorMessage(message);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [vehicleId],
  );

  return {
    vehicleId,
    setVehicleId,
    status,
    vehicle,
    errorMessage,
    isLoading,
    isUpdating,
    updateStatus,
  };
}
