"use client";

import { useCallback, useState } from "react";
import { updateVehicleStatus as updateVehicleStatusApi } from "../api/driver-api";
import type { DriverVehicle, VehicleStatus } from "../types/driver.types";

export function useVehicleStatus(
  initialVehicleId: string = "00000000-0000-4000-8000-000000000010",
  initialStatus: VehicleStatus = "OFFLINE",
) {
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [status, setStatus] = useState<VehicleStatus>(initialStatus);
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    isUpdating,
    updateStatus,
  };
}
