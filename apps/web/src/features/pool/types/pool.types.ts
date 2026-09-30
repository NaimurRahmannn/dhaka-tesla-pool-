export type PoolStatus = "MATCHING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type PoolMember = {
  id?: string;
  rideRequestId?: string;
  seatCount?: number;
  farePaisa?: number;
};

export type Pool = {
  id: string;
  status: PoolStatus;
  vehicleId?: string;
  vehicleName?: string;
  memberCount: number;
  capacity?: number;
  members?: PoolMember[];
};
