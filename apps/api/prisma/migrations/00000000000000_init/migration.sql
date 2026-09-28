-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PASSENGER', 'DRIVER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('MATCHING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'OFFLINE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "pickup_lat" DECIMAL(10,7) NOT NULL,
    "pickup_lng" DECIMAL(10,7) NOT NULL,
    "destination_lat" DECIMAL(10,7) NOT NULL,
    "destination_lng" DECIMAL(10,7) NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_seats" INTEGER NOT NULL DEFAULT 1,
    "estimated_fare_paisa" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_snapshots" (
    "id" UUID NOT NULL,
    "ride_request_id" UUID NOT NULL,
    "distance_meter" INTEGER NOT NULL,
    "duration_second" INTEGER NOT NULL,
    "geometry" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "PoolStatus" NOT NULL DEFAULT 'MATCHING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_members" (
    "id" UUID NOT NULL,
    "pool_id" UUID NOT NULL,
    "ride_request_id" UUID NOT NULL,
    "seat_count" INTEGER NOT NULL,
    "fare_paisa" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_status_history" (
    "id" UUID NOT NULL,
    "ride_request_id" UUID NOT NULL,
    "previous_status" "RideStatus",
    "new_status" "RideStatus" NOT NULL,
    "changed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "vehicles_driver_id_idx" ON "vehicles"("driver_id");

-- CreateIndex
CREATE INDEX "ride_requests_passenger_id_idx" ON "ride_requests"("passenger_id");

-- CreateIndex
CREATE INDEX "ride_requests_status_created_at_idx" ON "ride_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "route_snapshots_ride_request_id_created_at_idx" ON "route_snapshots"("ride_request_id", "created_at");

-- CreateIndex
CREATE INDEX "pools_vehicle_id_status_idx" ON "pools"("vehicle_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pool_members_ride_request_id_key" ON "pool_members"("ride_request_id");

-- CreateIndex
CREATE INDEX "pool_members_pool_id_idx" ON "pool_members"("pool_id");

-- CreateIndex
CREATE INDEX "ride_status_history_ride_request_id_created_at_idx" ON "ride_status_history"("ride_request_id", "created_at");

-- CreateIndex
CREATE INDEX "ride_status_history_changed_by_idx" ON "ride_status_history"("changed_by");

-- AddCheckConstraints
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_requested_seats_positive" CHECK ("requested_seats" > 0);
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_estimated_fare_non_negative" CHECK ("estimated_fare_paisa" IS NULL OR "estimated_fare_paisa" >= 0);
ALTER TABLE "route_snapshots" ADD CONSTRAINT "route_snapshots_distance_non_negative" CHECK ("distance_meter" >= 0);
ALTER TABLE "route_snapshots" ADD CONSTRAINT "route_snapshots_duration_non_negative" CHECK ("duration_second" >= 0);
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_seat_count_positive" CHECK ("seat_count" > 0);
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_fare_non_negative" CHECK ("fare_paisa" >= 0);

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_snapshots" ADD CONSTRAINT "route_snapshots_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_status_history" ADD CONSTRAINT "ride_status_history_ride_request_id_fkey" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_status_history" ADD CONSTRAINT "ride_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
