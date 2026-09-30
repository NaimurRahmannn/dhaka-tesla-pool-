import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOsrmRoute, isValidCoordinate, useMapRoute } from "./use-map-route";

describe("use-map-route", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates coordinates correctly", () => {
    expect(isValidCoordinate({ lat: 23.7937, lng: 90.4043 })).toBe(true);
    expect(isValidCoordinate({ lat: 95, lng: 90.4043 })).toBe(false);
    expect(isValidCoordinate({ lat: 23.7937, lng: 195 })).toBe(false);
    expect(isValidCoordinate(null)).toBe(false);
    expect(isValidCoordinate(undefined)).toBe(false);
  });

  it("fetches route preview successfully from OSRM", async () => {
    const mockOsrmResponse = {
      code: "Ok",
      routes: [
        {
          distance: 4200,
          duration: 720,
          geometry: {
            coordinates: [
              [90.4043, 23.7937],
              [90.4055, 23.794],
              [90.4078, 23.7925],
            ],
          },
        },
      ],
    };

    const fetchMock = vi.fn(async () => Response.json(mockOsrmResponse));
    vi.stubGlobal("fetch", fetchMock);

    const pickup = { lat: 23.7937, lng: 90.4043 };
    const destination = { lat: 23.7925, lng: 90.4078 };

    const result = await fetchOsrmRoute(pickup, destination);

    expect(result.distanceMeter).toBe(4200);
    expect(result.durationSecond).toBe(720);
    expect(result.distanceKm).toBe("4.2");
    expect(result.durationMinutes).toBe(12);
    // Verified coordinate conversion from [lng, lat] to [lat, lng]
    expect(result.coordinates[0]).toEqual([23.7937, 90.4043]);
    expect(result.coordinates[2]).toEqual([23.7925, 90.4078]);
  });

  it("hook returns route preview when pickup and destination are provided", async () => {
    const mockOsrmResponse = {
      code: "Ok",
      routes: [
        {
          distance: 2500,
          duration: 400,
          geometry: {
            coordinates: [
              [90.4043, 23.7937],
              [90.4078, 23.7925],
            ],
          },
        },
      ],
    };

    const fetchMock = vi.fn(async () => Response.json(mockOsrmResponse));
    vi.stubGlobal("fetch", fetchMock);

    const pickup = { lat: 23.7937, lng: 90.4043 };
    const destination = { lat: 23.7925, lng: 90.4078 };

    const { result } = renderHook(() => useMapRoute(pickup, destination));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.route).not.toBeNull();
    });

    expect(result.current.route?.distanceMeter).toBe(2500);
    expect(result.current.errorMessage).toBeNull();
  });

  it("handles same pickup and destination error", async () => {
    const point = { lat: 23.7937, lng: 90.4043 };

    const { result } = renderHook(() => useMapRoute(point, point));

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        "Pickup and destination cannot be the same point",
      );
    });

    expect(result.current.route).toBeNull();
  });

  it("handles routing API failure gracefully without crashing", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("Network offline");
    });
    vi.stubGlobal("fetch", fetchMock);

    const pickup = { lat: 23.7937, lng: 90.4043 };
    const destination = { lat: 23.7925, lng: 90.4078 };

    const { result } = renderHook(() => useMapRoute(pickup, destination));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.errorMessage).toBe("Network offline");
    });

    expect(result.current.route).toBeNull();
  });
});
