import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth-storage";
import { getAssignedPools, getDriverPools } from "./pool-api";

describe("pool-api", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.test";
    window.localStorage.clear();
    setToken("driver-jwt-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches driver pools from /driver/pools", async () => {
    const mockPools = [
      {
        id: "pool-xyz-789",
        status: "ACTIVE" as const,
        vehicleId: "veh-tesla-1",
        memberCount: 2,
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockPools));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDriverPools();

    expect(result).toEqual(mockPools);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/driver/pools",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("getAssignedPools delegates to getDriverPools", async () => {
    const mockPools = [
      {
        id: "pool-abc-123",
        status: "MATCHING" as const,
        vehicleId: "veh-tesla-2",
        memberCount: 1,
      },
    ];
    const fetchMock = vi.fn(async () => Response.json(mockPools));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAssignedPools();

    expect(result).toEqual(mockPools);
  });
});
