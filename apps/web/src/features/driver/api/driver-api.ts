import { apiClient } from "@/lib/api-client";
import type {
  AssignedRide,
  DriverPool,
  DriverRide,
  DriverVehicle,
  NearbyRide,
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

export function getDriverVehicles(): Promise<DriverVehicle[]> {
  return apiClient.get<DriverVehicle[]>("/driver/vehicles");
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

export function getAssignedRides(): Promise<AssignedRide[]> {
  return apiClient.get<AssignedRide[]>("/driver/rides/assigned");
}

export function getNearbyRides(
  lat: number,
  lng: number,
  radius = 3000,
): Promise<NearbyRide[]> {
  return apiClient.get<NearbyRide[]>(
    `/driver/rides/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
  );
}

export function acceptRide(rideId: string): Promise<DriverRide> {
  return apiClient.post<DriverRide>(`/driver/rides/${rideId}/accept`);
}

export function autoAssignClosestRide(
  lat: number,
  lng: number,
  radius = 3000,
): Promise<DriverRide & { distanceMeter: number }> {
  return apiClient.post<DriverRide & { distanceMeter: number }>(
    "/driver/rides/auto-assign",
    { lat, lng, radius },
  );
}
