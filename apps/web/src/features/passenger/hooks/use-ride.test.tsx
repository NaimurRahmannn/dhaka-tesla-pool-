import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelRide, getRide } from "../api/passenger-api";
import { useRide } from "./use-ride";

vi.mock("../api/passenger-api", () => ({
  cancelRide: vi.fn(),
  getRide: vi.fn(),
}));

describe("useRide", () => {
  beforeEach(() => {
    vi.mocked(cancelRide).mockReset();
    vi.mocked(getRide).mockReset();
  });

  it("fetches and returns a single ride on mount", async () => {
    const mockRide = {
      id: "ride-123",
      status: "REQUESTED" as const,
      estimatedFarePaisa: 6000,
    };
    vi.mocked(getRide).mockResolvedValue(mockRide);

    const { result } = renderHook(() => useRide("ride-123"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ride).toEqual(mockRide);
    expect(result.current.errorMessage).toBeNull();
  });

  it("cancels ride and updates status to CANCELLED", async () => {
    const initialRide = {
      id: "ride-123",
      status: "REQUESTED" as const,
      estimatedFarePaisa: 6000,
    };
    vi.mocked(getRide).mockResolvedValue(initialRide);
    vi.mocked(cancelRide).mockResolvedValue({
      id: "ride-123",
      status: "CANCELLED",
    });

    const { result } = renderHook(() => useRide("ride-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.cancel();
    });

    expect(cancelRide).toHaveBeenCalledWith("ride-123");
    expect(result.current.ride?.status).toBe("CANCELLED");
  });

  it("handles cancellation error gracefully", async () => {
    const initialRide = {
      id: "ride-123",
      status: "REQUESTED" as const,
      estimatedFarePaisa: 6000,
    };
    vi.mocked(getRide).mockResolvedValue(initialRide);
    vi.mocked(cancelRide).mockRejectedValue(new Error("Ride cannot be cancelled"));

    const { result } = renderHook(() => useRide("ride-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.cancel();
      } catch {
        // expected error
      }
    });

    expect(result.current.errorMessage).toBe("Ride cannot be cancelled");
    expect(result.current.isCancelling).toBe(false);
  });
});
