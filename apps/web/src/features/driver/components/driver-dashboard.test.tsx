import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAssignedPools } from "../api/driver-api";
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
}));

describe("DriverDashboard", () => {
  beforeEach(() => {
    vi.mocked(getAssignedPools).mockReset();
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
});
