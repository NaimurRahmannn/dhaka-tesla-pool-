import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAssignedPools } from "../api/driver-api";
import { useDriverPools } from "./use-driver-pools";

vi.mock("../api/driver-api", () => ({
  getAssignedPools: vi.fn(),
}));

describe("useDriverPools", () => {
  beforeEach(() => {
    vi.mocked(getAssignedPools).mockReset();
  });

  it("fetches and returns assigned pools", async () => {
    const mockPools = [
      { id: "pool-1", status: "ACTIVE" as const, vehicleId: "veh-1", memberCount: 2 },
    ];
    vi.mocked(getAssignedPools).mockResolvedValue(mockPools);

    const { result } = renderHook(() => useDriverPools());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pools).toEqual(mockPools);
    expect(result.current.errorMessage).toBeNull();
  });

  it("sets error message when fetching pools fails", async () => {
    vi.mocked(getAssignedPools).mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useDriverPools());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe("Network failed");
    expect(result.current.pools).toEqual([]);
  });
});
