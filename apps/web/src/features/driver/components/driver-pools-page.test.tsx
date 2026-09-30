import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDriverPools } from "@/features/pool/api/pool-api";
import { DriverPoolsPage } from "./driver-pools-page";

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/features/pool/api/pool-api", () => ({
  getDriverPools: vi.fn(),
}));

describe("DriverPoolsPage", () => {
  beforeEach(() => {
    vi.mocked(getDriverPools).mockReset();
  });

  it("renders pool summaries with pool id, vehicle, status, and members", async () => {
    vi.mocked(getDriverPools).mockResolvedValue([
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
    expect(screen.getByText("Bullet Tesla")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("renders empty state when no pools exist", async () => {
    vi.mocked(getDriverPools).mockResolvedValue([]);

    render(<DriverPoolsPage />);

    expect(
      await screen.findByText("No pools currently assigned."),
    ).toBeInTheDocument();
  });

  it("renders error message when loading pools fails", async () => {
    vi.mocked(getDriverPools).mockRejectedValue(new Error("Failed to load driver pools"));

    render(<DriverPoolsPage />);

    expect(
      await screen.findByText("Failed to load driver pools"),
    ).toBeInTheDocument();
  });
});
