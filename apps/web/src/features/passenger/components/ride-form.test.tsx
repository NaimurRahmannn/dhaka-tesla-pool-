import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRide } from "../api/passenger-api";
import { RideForm } from "./ride-form";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("../api/passenger-api", () => ({
  createRide: vi.fn(),
}));

describe("RideForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(createRide).mockReset();
  });

  it("renders coordinate fields and submit button", () => {
    render(<RideForm />);

    expect(screen.getByLabelText("Pickup latitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Pickup longitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination latitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination longitude")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request ride" }),
    ).toBeInTheDocument();
  });

  it("submits coordinate data and redirects upon success", async () => {
    vi.mocked(createRide).mockResolvedValue({
      id: "ride-456",
      status: "REQUESTED",
    });

    render(<RideForm />);

    fireEvent.change(screen.getByLabelText("Pickup latitude"), {
      target: { value: "23.7806" },
    });
    fireEvent.change(screen.getByLabelText("Pickup longitude"), {
      target: { value: "90.4074" },
    });
    fireEvent.change(screen.getByLabelText("Destination latitude"), {
      target: { value: "23.8103" },
    });
    fireEvent.change(screen.getByLabelText("Destination longitude"), {
      target: { value: "90.4125" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request ride" }));

    await waitFor(() => {
      expect(createRide).toHaveBeenCalledWith({
        pickupLat: 23.7806,
        pickupLng: 90.4074,
        destinationLat: 23.8103,
        destinationLng: 90.4125,
      });
      expect(pushMock).toHaveBeenCalledWith("/passenger/rides/ride-456");
    });
  });

  it("displays an error message when ride creation fails", async () => {
    vi.mocked(createRide).mockRejectedValue(
      new Error("Pickup coordinates out of service bounds"),
    );

    render(<RideForm />);

    fireEvent.change(screen.getByLabelText("Pickup latitude"), {
      target: { value: "23.7806" },
    });
    fireEvent.change(screen.getByLabelText("Pickup longitude"), {
      target: { value: "90.4074" },
    });
    fireEvent.change(screen.getByLabelText("Destination latitude"), {
      target: { value: "23.8103" },
    });
    fireEvent.change(screen.getByLabelText("Destination longitude"), {
      target: { value: "90.4125" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request ride" }));

    expect(
      await screen.findByText("Pickup coordinates out of service bounds"),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
