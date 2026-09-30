import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth-storage";
import {
  acceptRide,
  arriveRide,
  autoAssignClosestRide,
  completeRide,
  getAssignedPools,
  getAssignedRides,
  getCompletedRides,
  getDriverVehicles,
  getNearbyRides,
  startRide,
  updateVehicleStatus,
} from "./driver-api";

describe("driver api", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.test";
    window.localStorage.clear();
    setToken("driver-jwt-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates vehicle status to ONLINE", async () => {
    const mockVehicle = {
      id: "veh-1",
      driverId: "driver-1",
      name: "Bullet",
      capacity: 3,
      status: "ONLINE" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(mockVehicle));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateVehicleStatus("veh-1", "ONLINE")).resolves.toEqual(
      mockVehicle,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/vehicles/veh-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "ONLINE" }),
        headers: expect.any(Headers),
      }),
    );
    expect(
      ((fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers).get(
        "Authorization",
      ),
    ).toBe("Bearer driver-jwt-token");
  });

  it("gets assigned pools for the driver", async () => {
    const mockPools = [
      {
        id: "pool-1",
        status: "ACTIVE" as const,
        vehicleId: "veh-1",
        memberCount: 2,
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockPools));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAssignedPools()).resolves.toEqual(mockPools);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/pools",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("gets driver vehicles via getDriverVehicles", async () => {
    const mockVehicles = [
      {
        id: "veh-1",
        driverId: "driver-1",
        name: "Bullet",
        capacity: 3,
        status: "OFFLINE" as const,
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockVehicles));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDriverVehicles()).resolves.toEqual(mockVehicles);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/vehicles",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("transitions ride to DRIVER_ARRIVED via arriveRide", async () => {
    const mockRide = {
      id: "ride-1",
      status: "DRIVER_ARRIVED" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(mockRide));
    vi.stubGlobal("fetch", fetchMock);

    await expect(arriveRide("ride-1")).resolves.toEqual(mockRide);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/ride-1/arrive",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("transitions ride to STARTED via startRide", async () => {
    const mockRide = {
      id: "ride-1",
      status: "STARTED" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(mockRide));
    vi.stubGlobal("fetch", fetchMock);

    await expect(startRide("ride-1")).resolves.toEqual(mockRide);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/ride-1/start",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("transitions ride to COMPLETED via completeRide", async () => {
    const mockRide = {
      id: "ride-1",
      status: "COMPLETED" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(mockRide));
    vi.stubGlobal("fetch", fetchMock);

    await expect(completeRide("ride-1")).resolves.toEqual(mockRide);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/ride-1/complete",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("fetches assigned rides via getAssignedRides", async () => {
    const mockAssigned = [
      {
        id: "ride-1",
        passengerId: "p-1",
        passengerName: "Nusrat",
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.733,
        destinationLng: 90.4172,
        status: "MATCHED" as const,
        requestedSeats: 1,
        farePaisa: 35000,
        poolId: "pool-1",
        createdAt: "2026-09-30T10:00:00Z",
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockAssigned));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAssignedRides()).resolves.toEqual(mockAssigned);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/assigned",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches completed rides via getCompletedRides", async () => {
    const mockCompleted = [
      {
        id: "ride-completed-1",
        passengerId: "p-1",
        passengerName: "Nusrat",
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.733,
        destinationLng: 90.4172,
        status: "COMPLETED" as const,
        requestedSeats: 1,
        farePaisa: 35000,
        poolId: "pool-1",
        createdAt: "2026-09-30T10:00:00Z",
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockCompleted));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCompletedRides()).resolves.toEqual(mockCompleted);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/completed",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetches nearby rides via getNearbyRides", async () => {
    const mockNearby = [
      {
        id: "ride-1",
        passengerId: "p-1",
        passengerName: "Nusrat",
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.733,
        destinationLng: 90.4172,
        status: "REQUESTED" as const,
        requestedSeats: 1,
        estimatedFarePaisa: 35000,
        distanceMeter: 380,
        createdAt: "2026-09-30T10:00:00Z",
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockNearby));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getNearbyRides(23.7937, 90.4043, 3000)).resolves.toEqual(mockNearby);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/nearby?lat=23.7937&lng=90.4043&radius=3000",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("accepts a ride via acceptRide", async () => {
    const mockAccepted = {
      id: "ride-1",
      status: "MATCHED" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(mockAccepted));
    vi.stubGlobal("fetch", fetchMock);

    await expect(acceptRide("ride-1")).resolves.toEqual(mockAccepted);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/ride-1/accept",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("auto-assigns closest ride via autoAssignClosestRide", async () => {
    const mockAutoAssigned = {
      id: "ride-1",
      status: "MATCHED" as const,
      distanceMeter: 450,
    };
    const fetchMock = vi.fn(async () => Response.json(mockAutoAssigned));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      autoAssignClosestRide(23.7937, 90.4043, 3000),
    ).resolves.toEqual(mockAutoAssigned);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/rides/auto-assign",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ lat: 23.7937, lng: 90.4043, radius: 3000 }),
      }),
    );
  });
});
