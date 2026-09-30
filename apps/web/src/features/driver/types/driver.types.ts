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
