import { apiClient } from "@/lib/api-client";
import type {
  DriverPool,
  DriverRide,
  DriverVehicle,
  VehicleStatus,
} from "../types/driver.types";

export function updateVehicleStatus(
  vehicleId: string,
  status: VehicleStatus,
): Promise<DriverVehicle> {
  return apiClient.patch<DriverVehicle>(`/driver/vehicles/${vehicleId}/status`, {
    status,
  });
}

export function getAssignedPools(): Promise<DriverPool[]> {
  return apiClient.get<DriverPool[]>("/driver/pools");
}

export function arriveRide(rideId: string): Promise<DriverRide> {
  return apiClient.patch<DriverRide>(`/driver/rides/${rideId}/arrive`);
}

export function startRide(rideId: string): Promise<DriverRide> {
  return apiClient.patch<DriverRide>(`/driver/rides/${rideId}/start`);
}

export function completeRide(rideId: string): Promise<DriverRide> {
  return apiClient.patch<DriverRide>(`/driver/rides/${rideId}/complete`);
}
