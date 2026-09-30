import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelRide, getRide } from "../api/passenger-api";
import { RideDetailsPage } from "./ride-details";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../api/passenger-api", () => ({
  cancelRide: vi.fn(),
  getRide: vi.fn(),
}));

describe("RideDetailsPage", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.mocked(cancelRide).mockReset();
    vi.mocked(getRide).mockReset();
  });

  it("renders ride details including status and fare", async () => {
    vi.mocked(getRide).mockResolvedValue({
      id: "ride-123",
      status: "REQUESTED",
      pickupLat: 23.7806,
      pickupLng: 90.4074,
      destinationLat: 23.8103,
      destinationLng: 90.4125,
      estimatedFarePaisa: 7500,
    });

    render(<RideDetailsPage rideId="ride-123" />);

    expect(await screen.findByText("ride-123")).toBeInTheDocument();
    expect(screen.getByText("BDT 75.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel ride" })).toBeInTheDocument();
  });

  it("cancels a cancellable ride through the passenger api", async () => {
    vi.mocked(getRide).mockResolvedValue({
      id: "ride-id",
      status: "REQUESTED",
      estimatedFarePaisa: 7000,
    });
    vi.mocked(cancelRide).mockResolvedValue({
      id: "ride-id",
      status: "CANCELLED",
    });

    render(<RideDetailsPage rideId="ride-id" />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancel ride" }));

    expect(cancelRide).toHaveBeenCalledWith("ride-id");
    expect(await screen.findByText("CANCELLED")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("does not show cancel button for completed rides", async () => {
    vi.mocked(getRide).mockResolvedValue({
      id: "ride-completed",
      status: "COMPLETED",
      estimatedFarePaisa: 9000,
    });

    render(<RideDetailsPage rideId="ride-completed" />);

    expect(await screen.findByText("ride-completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel ride" })).not.toBeInTheDocument();
  });

  it("shows an error message when ride cancellation fails", async () => {
    vi.mocked(getRide).mockResolvedValue({
      id: "ride-fail",
      status: "REQUESTED",
      estimatedFarePaisa: 5000,
    });
    vi.mocked(cancelRide).mockRejectedValue(new Error("Cannot cancel active trip"));

    render(<RideDetailsPage rideId="ride-fail" />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancel ride" }));

    expect(await screen.findByText("Cannot cancel active trip")).toBeInTheDocument();
  });

  it("shows an error message when loading ride details fails", async () => {
    vi.mocked(getRide).mockRejectedValue(new Error("Ride not found"));

    render(<RideDetailsPage rideId="ride-nonexistent" />);

    expect(await screen.findByText("Ride not found")).toBeInTheDocument();
  });
});
