import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth-storage";
import {
  arriveRide,
  completeRide,
  getAssignedPools,
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
});
