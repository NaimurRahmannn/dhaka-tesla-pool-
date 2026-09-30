import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api-client";
import {
  acceptRide,
  autoAssignClosestRide,
  getNearbyRides,
} from "../api/driver-api";
import { useNearbyRides } from "./use-nearby-rides";

vi.mock("../api/driver-api", () => ({
  acceptRide: vi.fn(),
  autoAssignClosestRide: vi.fn(),
  getNearbyRides: vi.fn(),
}));

function NearbyRidesProbe() {
  const { accept, autoAssign, errorMessage } = useNearbyRides({
    isOnline: true,
    lat: 23.7937,
    lng: 90.4043,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void accept("ride-id").catch(() => undefined);
        }}
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => {
          void autoAssign().catch(() => undefined);
        }}
      >
        Auto assign
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  );
}

describe("useNearbyRides", () => {
  beforeEach(() => {
    vi.mocked(acceptRide).mockReset();
    vi.mocked(autoAssignClosestRide).mockReset();
    vi.mocked(getNearbyRides).mockReset();
    vi.mocked(getNearbyRides).mockResolvedValue([]);
  });

  it("shows a driver-friendly message when the vehicle has no seats left", async () => {
    vi.mocked(acceptRide).mockRejectedValue(
      new ApiClientError("Pool capacity exceeded", 400, {
        message: "Pool capacity exceeded",
      }),
    );

    render(<NearbyRidesProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(
        screen.getByText("No seats left in this vehicle. Bullet is already full."),
      ).toBeInTheDocument();
    });
  });

  it("uses the same full-seat message for auto assignment", async () => {
    vi.mocked(autoAssignClosestRide).mockRejectedValue(
      new ApiClientError("Pool capacity exceeded", 400, {
        message: "Pool capacity exceeded",
      }),
    );

    render(<NearbyRidesProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Auto assign" }));

    await waitFor(() => {
      expect(
        screen.getByText("No seats left in this vehicle. Bullet is already full."),
      ).toBeInTheDocument();
    });
  });
});
