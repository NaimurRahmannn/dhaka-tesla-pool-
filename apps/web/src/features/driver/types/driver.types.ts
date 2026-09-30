import type { PoolStatus, RideStatus, VehicleStatus } from "@/types";

export type { PoolStatus, RideStatus, VehicleStatus };

export type DriverVehicle = {
  id: string;
  driverId?: string;
  name?: string;
  capacity?: number;
  status: VehicleStatus;
};

export type DriverPool = {
  id: string;
  status: PoolStatus;
  vehicleId: string;
  memberCount: number;
};

export type DriverRide = {
  id: string;
  status: RideStatus;
};

export type UpdateVehicleStatusRequest = {
  status: VehicleStatus;
};

export type AssignedRide = {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: RideStatus;
  requestedSeats: number;
  farePaisa: number;
  poolId: string;
  createdAt: string;
};

export type NearbyRide = {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: RideStatus;
  requestedSeats: number;
  estimatedFarePaisa: number | null;
  distanceMeter: number;
  createdAt: string;
};
