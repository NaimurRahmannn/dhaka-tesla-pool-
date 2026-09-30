import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDriverVehicles, updateVehicleStatus } from "../api/driver-api";
import { VehicleStatusCard } from "./vehicle-status-card";

vi.mock("../api/driver-api", () => ({
  updateVehicleStatus: vi.fn(),
  getDriverVehicles: vi.fn(),
}));

describe("VehicleStatusCard", () => {
  beforeEach(() => {
    vi.mocked(updateVehicleStatus).mockReset();
    vi.mocked(getDriverVehicles).mockReset();
    vi.mocked(getDriverVehicles).mockResolvedValue([]);
  });

  it("renders offline status by default and allows going online", async () => {
    vi.mocked(updateVehicleStatus).mockResolvedValue({
      id: "veh-123",
      status: "ONLINE",
    });

    render(<VehicleStatusCard vehicleId="veh-123" initialStatus="OFFLINE" />);

    expect(screen.getByText("Vehicle is Offline")).toBeInTheDocument();
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go Online" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go Online" }));

    await waitFor(() => {
      expect(updateVehicleStatus).toHaveBeenCalledWith("veh-123", "ONLINE");
      expect(screen.getByText("Vehicle is Online")).toBeInTheDocument();
      expect(screen.getByText("ONLINE")).toBeInTheDocument();
    });
  });

  it("allows going offline when online", async () => {
    vi.mocked(updateVehicleStatus).mockResolvedValue({
      id: "veh-123",
      status: "OFFLINE",
    });

    render(<VehicleStatusCard vehicleId="veh-123" initialStatus="ONLINE" />);

    expect(screen.getByText("Vehicle is Online")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go Offline" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go Offline" }));

    await waitFor(() => {
      expect(updateVehicleStatus).toHaveBeenCalledWith("veh-123", "OFFLINE");
      expect(screen.getByText("Vehicle is Offline")).toBeInTheDocument();
    });
  });

  it("displays error message when status update fails", async () => {
    vi.mocked(updateVehicleStatus).mockRejectedValue(
      new Error("Vehicle does not belong to this driver"),
    );

    render(<VehicleStatusCard vehicleId="veh-wrong" initialStatus="OFFLINE" />);

    fireEvent.click(screen.getByRole("button", { name: "Go Online" }));

    expect(
      await screen.findByText("Vehicle does not belong to this driver"),
    ).toBeInTheDocument();
  });

  it("automatically loads the driver's vehicle when vehicleId is not provided", async () => {
    vi.mocked(getDriverVehicles).mockResolvedValue([
      {
        id: "veh-auto-1",
        driverId: "driver-1",
        name: "Bullet",
        capacity: 3,
        status: "OFFLINE",
      },
    ]);

    render(<VehicleStatusCard />);

    expect(await screen.findByText("veh-auto-1")).toBeInTheDocument();
    expect(screen.getByText(/Bullet/)).toBeInTheDocument();
  });

  it("loads the current vehicle status when a vehicleId is provided", async () => {
    const onStatusChange = vi.fn();
    vi.mocked(getDriverVehicles).mockResolvedValue([
      {
        id: "veh-auto-1",
        driverId: "driver-1",
        name: "Bullet",
        capacity: 3,
        status: "ONLINE",
      },
    ]);

    render(
      <VehicleStatusCard
        vehicleId="veh-auto-1"
        initialStatus="OFFLINE"
        onStatusChange={onStatusChange}
      />,
    );

    expect(await screen.findByText("Vehicle is Online")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Offline" })).toBeEnabled();
    expect(onStatusChange).toHaveBeenCalledWith("ONLINE");
  });
});
