export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

export type CreateRideRequest = {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
};

import type { Pool } from "@/features/pool";

export type Ride = {
  id: string;
  status: RideStatus;
  pickupLat?: number | string;
  pickupLng?: number | string;
  destinationLat?: number | string;
  destinationLng?: number | string;
  requestedSeats?: number;
  estimatedFarePaisa?: number | null;
  createdAt?: string;
  updatedAt?: string;
  poolId?: string | null;
  pool?: Pool | null;
};

export type RideMutationResult = {
  id: string;
  status: RideStatus;
};
