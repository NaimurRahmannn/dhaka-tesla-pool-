export type UserRole = "PASSENGER" | "DRIVER";

export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

export type PoolStatus = "MATCHING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type VehicleStatus = "OFFLINE" | "ONLINE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Ride {
  id: string;
  status: RideStatus;
  estimatedFarePaisa: number | null;
}

export interface Pool {
  id: string;
  status: PoolStatus;
  vehicleId: string;
  memberCount?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  capacity: number;
  status: VehicleStatus;
}
