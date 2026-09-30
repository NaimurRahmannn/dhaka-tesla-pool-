import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { arriveRide, completeRide, startRide } from "../api/driver-api";
import { useDriverRide } from "./use-driver-ride";

vi.mock("../api/driver-api", () => ({
  arriveRide: vi.fn(),
  startRide: vi.fn(),
  completeRide: vi.fn(),
}));

describe("useDriverRide", () => {
  beforeEach(() => {
    vi.mocked(arriveRide).mockReset();
    vi.mocked(startRide).mockReset();
    vi.mocked(completeRide).mockReset();
  });

  it("handles arrive action and transitions state", async () => {
    vi.mocked(arriveRide).mockResolvedValue({ id: "ride-1", status: "DRIVER_ARRIVED" });

    const { result } = renderHook(() => useDriverRide("ride-1", "MATCHED"));

    await act(async () => {
      await result.current.arrive();
    });

    expect(arriveRide).toHaveBeenCalledWith("ride-1");
    expect(result.current.status).toBe("DRIVER_ARRIVED");
  });

  it("handles start action and transitions state", async () => {
    vi.mocked(startRide).mockResolvedValue({ id: "ride-1", status: "STARTED" });

    const { result } = renderHook(() => useDriverRide("ride-1", "DRIVER_ARRIVED"));

    await act(async () => {
      await result.current.start();
    });

    expect(startRide).toHaveBeenCalledWith("ride-1");
    expect(result.current.status).toBe("STARTED");
  });

  it("handles complete action and transitions state", async () => {
    vi.mocked(completeRide).mockResolvedValue({ id: "ride-1", status: "COMPLETED" });

    const { result } = renderHook(() => useDriverRide("ride-1", "STARTED"));

    await act(async () => {
      await result.current.complete();
    });

    expect(completeRide).toHaveBeenCalledWith("ride-1");
    expect(result.current.status).toBe("COMPLETED");
  });

  it("handles action error properly", async () => {
    vi.mocked(arriveRide).mockRejectedValue(new Error("Vehicle is offline"));

    const { result } = renderHook(() => useDriverRide("ride-1", "MATCHED"));

    await act(async () => {
      try {
        await result.current.arrive();
      } catch {
        // expected error
      }
    });

    expect(result.current.errorMessage).toBe("Vehicle is offline");
  });
});
