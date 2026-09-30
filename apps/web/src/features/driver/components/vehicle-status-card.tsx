"use client";

import { useEffect, useState } from "react";
import { getDriverVehicles, updateVehicleStatus } from "../api/driver-api";
import type { VehicleStatus } from "../types/driver.types";

export function VehicleStatusCard({
  vehicleId,
  initialStatus = "OFFLINE",
  onStatusChange,
}: {
  vehicleId?: string;
  initialStatus?: VehicleStatus;
  onStatusChange?: (status: VehicleStatus) => void;
}) {
  const [currentVehicleId, setCurrentVehicleId] = useState(vehicleId ?? "");
  const [status, setStatus] = useState<VehicleStatus>(initialStatus);
  const [vehicleName, setVehicleName] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDriverVehicle() {
      if (vehicleId) {
        setCurrentVehicleId(vehicleId);
      }

      setIsLoading(true);
      try {
        const vehicles = await getDriverVehicles();
        const selectedVehicle = vehicleId
          ? vehicles.find((vehicle) => vehicle.id === vehicleId)
          : vehicles[0];

        if (isMounted && selectedVehicle) {
          setCurrentVehicleId(selectedVehicle.id);
          setStatus(selectedVehicle.status);
          setVehicleName(selectedVehicle.name ?? null);
          onStatusChange?.(selectedVehicle.status);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load driver vehicle",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDriverVehicle();
    return () => {
      isMounted = false;
    };
  }, [vehicleId, onStatusChange]);

  async function handleToggleStatus(nextStatus: VehicleStatus) {
    if (!currentVehicleId) {
      setErrorMessage("No vehicle ID available to update");
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const updated = await updateVehicleStatus(currentVehicleId, nextStatus);
      setStatus(updated.status);
      onStatusChange?.(updated.status);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update vehicle status",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const isOnline = status === "ONLINE";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vehicle Status
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-950">
              {isOnline ? "Vehicle is Online" : "Vehicle is Offline"}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isOnline
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Vehicle ID:{" "}
            <span className="font-mono">
              {currentVehicleId || (isLoading ? "Loading vehicle..." : "None")}
            </span>
            {vehicleName ? (
              <span className="ml-1 font-medium text-slate-700">({vehicleName})</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              onClick={() => handleToggleStatus("OFFLINE")}
              disabled={isUpdating || !currentVehicleId}
            >
              {isUpdating ? "Updating..." : "Go Offline"}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => handleToggleStatus("ONLINE")}
              disabled={isUpdating || !currentVehicleId}
            >
              {isUpdating ? "Updating..." : "Go Online"}
            </button>
          )}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <label className="flex items-center gap-2">
          <span>Active vehicle:</span>
          <input
            type="text"
            className="rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 outline-none focus:border-emerald-600"
            value={currentVehicleId}
            onChange={(e) => setCurrentVehicleId(e.target.value)}
          />
        </label>
      </div>
    </article>
  );
}
