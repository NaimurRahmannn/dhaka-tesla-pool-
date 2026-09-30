import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAssignedPools } from "../api/driver-api";
import { DriverPoolsPage } from "./driver-pools-page";

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../api/driver-api", () => ({
  getAssignedPools: vi.fn(),
}));

describe("DriverPoolsPage", () => {
  beforeEach(() => {
    vi.mocked(getAssignedPools).mockReset();
  });

  it("renders assigned pools list", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([
      {
        id: "pool-alpha",
        status: "ACTIVE",
        vehicleId: "veh-bullet",
        memberCount: 3,
      },
    ]);

    render(<DriverPoolsPage />);

    expect(screen.getByText("Assigned Pools")).toBeInTheDocument();
    expect(await screen.findByText("pool-alpha")).toBeInTheDocument();
  });

  it("renders empty state when no pools exist", async () => {
    vi.mocked(getAssignedPools).mockResolvedValue([]);

    render(<DriverPoolsPage />);

    expect(
      await screen.findByText("No pools currently assigned."),
    ).toBeInTheDocument();
  });
});
