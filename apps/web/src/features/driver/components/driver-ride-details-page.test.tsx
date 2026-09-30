import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAssignedRides } from "../api/driver-api";
import { DriverRideDetailsPage } from "./driver-ride-details-page";

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../api/driver-api", () => ({
  getAssignedRides: vi.fn(),
  arriveRide: vi.fn(),
  startRide: vi.fn(),
  completeRide: vi.fn(),
}));

describe("DriverRideDetailsPage", () => {
  beforeEach(() => {
    vi.mocked(getAssignedRides).mockReset();
  });

  it("renders route visualization when ride route information exists", async () => {
    vi.mocked(getAssignedRides).mockResolvedValue([
      {
        id: "ride-driver-1",
        passengerId: "p-1",
        passengerName: "Nusrat",
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.733,
        destinationLng: 90.4172,
        status: "MATCHED",
        requestedSeats: 1,
        farePaisa: 35000,
        poolId: "pool-alpha",
        createdAt: "2026-09-30T10:00:00Z",
      },
    ]);

    render(<DriverRideDetailsPage rideId="ride-driver-1" />);

    expect(
      await screen.findByTestId("driver-route-visualization"),
    ).toBeInTheDocument();
    expect(screen.getByText("Assigned Route Visualization")).toBeInTheDocument();
    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
    expect(screen.getByTestId("driver-pickup-coords")).toHaveTextContent(
      "23.79370, 90.40430",
    );
    expect(screen.getByTestId("driver-destination-coords")).toHaveTextContent(
      "23.73300, 90.41720",
    );
  });

  it("hides route visualization when ride route information is unavailable", async () => {
    vi.mocked(getAssignedRides).mockResolvedValue([]);

    render(<DriverRideDetailsPage rideId="ride-unknown" />);

    expect(
      screen.queryByTestId("driver-route-visualization"),
    ).not.toBeInTheDocument();
  });
});
