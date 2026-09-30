import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth-storage";
import { cancelRide, createRide, getRide, getRides } from "./passenger-api";

const ride = {
  id: "ride-id",
  status: "REQUESTED" as const,
  estimatedFarePaisa: 7000,
};

describe("passenger api", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.test";
    window.localStorage.clear();
    setToken("jwt-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a ride request", async () => {
    const fetchMock = vi.fn(async () => Response.json(ride));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createRide({
        pickupLat: 23.7806,
        pickupLng: 90.4074,
        destinationLat: 23.8103,
        destinationLng: 90.4125,
      }),
    ).resolves.toEqual(ride);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/rides",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          pickupLat: 23.7806,
          pickupLng: 90.4074,
          destinationLat: 23.8103,
          destinationLng: 90.4125,
        }),
        headers: expect.any(Headers),
      }),
    );
    expect(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).headers,
    ).toHaveProperty("get");
    expect(
      ((fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers).get(
        "Authorization",
      ),
    ).toBe("Bearer jwt-token");
  });

  it("gets passenger rides", async () => {
    const fetchMock = vi.fn(async () => Response.json([ride]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getRides()).resolves.toEqual([ride]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/rides",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("gets one passenger ride", async () => {
    const fetchMock = vi.fn(async () => Response.json(ride));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getRide("ride-id")).resolves.toEqual(ride);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/rides/ride-id",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("cancels a passenger ride", async () => {
    const cancelledRide = {
      id: "ride-id",
      status: "CANCELLED" as const,
    };
    const fetchMock = vi.fn(async () => Response.json(cancelledRide));
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelRide("ride-id")).resolves.toEqual(cancelledRide);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/rides/ride-id/cancel",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });
});
