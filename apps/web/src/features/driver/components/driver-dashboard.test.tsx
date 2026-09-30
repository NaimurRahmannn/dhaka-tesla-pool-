import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAssignedPools,
  getCompletedRides,
  getDriverVehicles,
} from "../api/driver-api";
import { DriverDashboard } from "./driver-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      name: "Jashim Driver",
      email: "jashim@tesla-pool.local",
      role: "DRIVER",
    },
  }),
}));

vi.mock("../api/driver-api", () => ({
  getAssignedPools: vi.fn(),
  updateVehicleStatus: vi.fn(),
  getDriverVehicles: vi.fn(),
  getAssignedRides: vi.fn().mockResolvedValue([]),
  getCompletedRides: vi.fn().mockResolvedValue([]),
  getNearbyRides: vi.fn().mockResolvedValue([]),
  acceptRide: vi.fn(),
  autoAssignClosestRide: vi.fn(),
}));

describe("DriverDashboard", () => {
  beforeEach(() => {
    vi.mocked(getAssignedPools).mockReset();
    vi.mocked(getCompletedRides).mockReset();
    vi.mocked(getDriverVehicles).mockReset();
    vi.mocked(getCompletedRides).mockResolvedValue([]);
    vi.mocked(getDriverVehicles).mockResolvedValue([
      {
        id: "veh-1",
        driverId: "00000000-0000-4000-8000-000000000001",
        name: "Bullet",
        capacity: 3,
        status: "OFFLINE",
      },
    ]);
  });

  it("renders driver information, vehicle status, and pool summary", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([
      {
        id: "pool-1",
        status: "ACTIVE",
        vehicleId: "veh-1",
        memberCount: 2,
      },
    ]);

    render(<DriverDashboard />);

    expect(screen.getByText("Welcome back, Jashim Driver")).toBeInTheDocument();
    expect(screen.getAllByText("jashim@tesla-pool.local").length).toBeGreaterThan(0);
    expect(screen.getByText("Vehicle Status")).toBeInTheDocument();
    expect(await screen.findByText("pool-1")).toBeInTheDocument();
    expect(screen.getByText("Pool Summary")).toBeInTheDocument();
  });

  it("renders empty state when there are no assigned pools", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([]);

    render(<DriverDashboard />);

    expect(
      await screen.findByText("No pools assigned to this driver yet."),
    ).toBeInTheDocument();
  });

  it("renders completed ride history separately from active rides", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([]);
    vi.mocked(getCompletedRides).mockResolvedValue([
      {
        id: "ride-completed-1",
        passengerId: "p-1",
        passengerName: "Nusrat",
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.7804,
        destinationLng: 90.419,
        status: "COMPLETED",
        requestedSeats: 1,
        farePaisa: 4000,
        poolId: "pool-1",
        createdAt: "2026-09-30T10:00:00Z",
      },
    ]);

    render(<DriverDashboard />);

    expect(await screen.findByText("Completed Trip History")).toBeInTheDocument();
    expect(await screen.findByText("Nusrat")).toBeInTheDocument();
    expect(screen.getByText("Finished Passenger Trips (1)")).toBeInTheDocument();
  });

  it("restores the fetched online vehicle status when returning with an assigned pool", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([
      {
        id: "pool-1",
        status: "ACTIVE",
        vehicleId: "veh-1",
        memberCount: 1,
      },
    ]);
    vi.mocked(getDriverVehicles).mockResolvedValue([
      {
        id: "veh-1",
        driverId: "00000000-0000-4000-8000-000000000001",
        name: "Bullet",
        capacity: 3,
        status: "ONLINE",
      },
    ]);

    render(<DriverDashboard />);

    expect(await screen.findByText("Vehicle is Online")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Offline" })).toBeEnabled();
  });

  it("renders profile icon and logout button in header", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([]);

    render(<DriverDashboard />);

    expect(screen.getByTestId("profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Jashim Driver");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Driver");
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });
});
