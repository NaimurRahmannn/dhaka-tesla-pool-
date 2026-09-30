import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { arriveRide, completeRide, startRide } from "../api/driver-api";
import { DriverRideActions } from "./driver-ride-actions";

vi.mock("../api/driver-api", () => ({
  arriveRide: vi.fn(),
  startRide: vi.fn(),
  completeRide: vi.fn(),
}));

describe("DriverRideActions", () => {
  beforeEach(() => {
    vi.mocked(arriveRide).mockReset();
    vi.mocked(startRide).mockReset();
    vi.mocked(completeRide).mockReset();
  });

  it("handles arrival action when status is MATCHED", async () => {
    vi.mocked(arriveRide).mockResolvedValue({
      id: "ride-101",
      status: "DRIVER_ARRIVED",
    });

    render(<DriverRideActions rideId="ride-101" initialStatus="MATCHED" />);

    expect(screen.getByTestId("ride-status-badge")).toHaveTextContent("MATCHED");
    expect(
      screen.getByRole("button", { name: "Arrive at pickup" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Arrive at pickup" }));

    await waitFor(() => {
      expect(arriveRide).toHaveBeenCalledWith("ride-101");
      expect(screen.getByTestId("ride-status-badge")).toHaveTextContent(
        "DRIVER_ARRIVED",
      );
      expect(
        screen.getByRole("button", { name: "Start ride" }),
      ).toBeInTheDocument();
    });
  });

  it("handles start ride action when status is DRIVER_ARRIVED", async () => {
    vi.mocked(startRide).mockResolvedValue({
      id: "ride-102",
      status: "STARTED",
    });

    render(<DriverRideActions rideId="ride-102" initialStatus="DRIVER_ARRIVED" />);

    expect(
      screen.getByRole("button", { name: "Start ride" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start ride" }));

    await waitFor(() => {
      expect(startRide).toHaveBeenCalledWith("ride-102");
      expect(screen.getByTestId("ride-status-badge")).toHaveTextContent("STARTED");
      expect(
        screen.getByRole("button", { name: "Complete ride" }),
      ).toBeInTheDocument();
    });
  });

  it("handles complete ride action when status is STARTED", async () => {
    vi.mocked(completeRide).mockResolvedValue({
      id: "ride-103",
      status: "COMPLETED",
    });

    render(<DriverRideActions rideId="ride-103" initialStatus="STARTED" />);

    expect(
      screen.getByRole("button", { name: "Complete ride" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Complete ride" }));

    await waitFor(() => {
      expect(completeRide).toHaveBeenCalledWith("ride-103");
      expect(screen.getByTestId("ride-status-badge")).toHaveTextContent(
        "COMPLETED",
      );
      expect(
        screen.getByText(/Ride completed. No further driver actions required./i),
      ).toBeInTheDocument();
    });
  });

  it("displays error message when action fails", async () => {
    vi.mocked(arriveRide).mockRejectedValue(
      new Error("Vehicle must be online for ride actions"),
    );

    render(<DriverRideActions rideId="ride-error" initialStatus="MATCHED" />);

    fireEvent.click(screen.getByRole("button", { name: "Arrive at pickup" }));

    expect(
      await screen.findByText("Vehicle must be online for ride actions"),
    ).toBeInTheDocument();
  });
});
