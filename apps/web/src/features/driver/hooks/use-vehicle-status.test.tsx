import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateVehicleStatus } from "../api/driver-api";
import { useVehicleStatus } from "./use-vehicle-status";

vi.mock("../api/driver-api", () => ({
  updateVehicleStatus: vi.fn(),
}));

describe("useVehicleStatus", () => {
  beforeEach(() => {
    vi.mocked(updateVehicleStatus).mockReset();
  });

  it("updates vehicle status and state", async () => {
    vi.mocked(updateVehicleStatus).mockResolvedValue({
      id: "veh-1",
      status: "ONLINE",
    });

    const { result } = renderHook(() => useVehicleStatus("veh-1", "OFFLINE"));

    expect(result.current.status).toBe("OFFLINE");

    await act(async () => {
      await result.current.updateStatus("ONLINE");
    });

    expect(updateVehicleStatus).toHaveBeenCalledWith("veh-1", "ONLINE");
    expect(result.current.status).toBe("ONLINE");
  });

  it("captures error message when update fails", async () => {
    vi.mocked(updateVehicleStatus).mockRejectedValue(new Error("Vehicle offline error"));

    const { result } = renderHook(() => useVehicleStatus("veh-1", "OFFLINE"));

    await act(async () => {
      try {
        await result.current.updateStatus("ONLINE");
      } catch {
        // expected error
      }
    });

    expect(result.current.errorMessage).toBe("Vehicle offline error");
  });
});
