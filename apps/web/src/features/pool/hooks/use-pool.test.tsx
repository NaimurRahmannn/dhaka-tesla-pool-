import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDriverPools } from "../api/pool-api";
import type { Pool } from "../types/pool.types";
import { usePool } from "./use-pool";

vi.mock("../api/pool-api", () => ({
  getDriverPools: vi.fn(),
  getAssignedPools: vi.fn(),
}));

describe("usePool", () => {
  beforeEach(() => {
    vi.mocked(getDriverPools).mockReset();
  });

  it("fetches and returns pools on mount", async () => {
    const mockPools: Pool[] = [
      { id: "pool-1", status: "ACTIVE", memberCount: 2, vehicleName: "Bullet Tesla" },
      { id: "pool-2", status: "MATCHING", memberCount: 1, vehicleName: "Bullet Tesla" },
    ];
    vi.mocked(getDriverPools).mockResolvedValue(mockPools);

    const { result } = renderHook(() => usePool());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pools).toEqual(mockPools);
    expect(result.current.pool).toEqual(mockPools[0]);
    expect(result.current.errorMessage).toBeNull();
  });

  it("selects specific pool by poolId", async () => {
    const mockPools: Pool[] = [
      { id: "pool-1", status: "ACTIVE", memberCount: 2 },
      { id: "pool-2", status: "MATCHING", memberCount: 1 },
    ];
    vi.mocked(getDriverPools).mockResolvedValue(mockPools);

    const { result } = renderHook(() => usePool("pool-2"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pool).toEqual(mockPools[1]);
  });

  it("uses initialPool without triggering initial fetch", () => {
    const initial: Pool = { id: "pool-init", status: "ACTIVE", memberCount: 3 };

    const { result } = renderHook(() => usePool("pool-init", initial));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.pool).toEqual(initial);
    expect(getDriverPools).not.toHaveBeenCalled();
  });

  it("handles fetch error gracefully", async () => {
    vi.mocked(getDriverPools).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePool());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMessage).toBe("Network error");
    expect(result.current.pools).toEqual([]);
    expect(result.current.pool).toBeNull();
  });
});
