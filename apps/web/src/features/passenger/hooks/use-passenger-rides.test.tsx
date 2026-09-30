import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRides } from "../api/passenger-api";
import { usePassengerRides } from "./use-passenger-rides";

vi.mock("../api/passenger-api", () => ({
  getRides: vi.fn(),
}));

describe("usePassengerRides", () => {
  beforeEach(() => {
    vi.mocked(getRides).mockReset();
  });

  it("fetches and returns rides on mount", async () => {
    const mockRides = [
      { id: "ride-1", status: "REQUESTED" as const, estimatedFarePaisa: 5000 },
    ];
    vi.mocked(getRides).mockResolvedValue(mockRides);

    const { result } = renderHook(() => usePassengerRides());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rides).toEqual(mockRides);
    expect(result.current.errorMessage).toBeNull();
  });

  it("sets error message when fetching fails", async () => {
    vi.mocked(getRides).mockRejectedValue(new Error("Failed to load rides"));

    const { result } = renderHook(() => usePassengerRides());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe("Failed to load rides");
    expect(result.current.rides).toEqual([]);
  });
});
