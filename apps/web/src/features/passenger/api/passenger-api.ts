import { apiClient } from "@/lib/api-client";
import type {
  CreateRideRequest,
  Ride,
  RideMutationResult,
} from "../types/passenger.types";

export function createRide(
  payload: CreateRideRequest,
): Promise<RideMutationResult> {
  return apiClient.post<RideMutationResult>("/rides", payload);
}

export function getRides(): Promise<Ride[]> {
  return apiClient.get<Ride[]>("/rides");
}

export function getRide(rideId: string): Promise<Ride> {
  return apiClient.get<Ride>(`/rides/${rideId}`);
}

export function cancelRide(rideId: string): Promise<RideMutationResult> {
  return apiClient.patch<RideMutationResult>(`/rides/${rideId}/cancel`);
}
