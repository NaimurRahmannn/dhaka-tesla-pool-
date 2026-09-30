import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Pool } from "../types/pool.types";
import { PoolCard } from "./pool-card";

describe("PoolCard", () => {
  const mockPool: Pool = {
    id: "pool-abc-123",
    status: "ACTIVE",
    memberCount: 2,
    capacity: 3,
    vehicleName: "Bullet Tesla",
  };

  it("renders passenger pool summary correctly", () => {
    render(<PoolCard pool={mockPool} isPassengerView />);

    expect(screen.getByText("Your ride is pooled")).toBeInTheDocument();
    expect(screen.getByText("pool-abc-123")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("Bullet Tesla")).not.toBeInTheDocument();
  });

  it("renders driver pool summary with vehicle and capacity correctly", () => {
    render(<PoolCard pool={mockPool} isPassengerView={false} />);

    expect(screen.queryByText("Your ride is pooled")).not.toBeInTheDocument();
    expect(screen.getByText("pool-abc-123")).toBeInTheDocument();
    expect(screen.getByText("Bullet Tesla")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("does not expose unnecessary passenger information in passenger view", () => {
    const poolWithPrivateData: Pool = {
      ...mockPool,
      members: [
        { id: "mem-1", rideRequestId: "ride-req-1", seatCount: 1 },
        { id: "mem-2", rideRequestId: "ride-req-2", seatCount: 1 },
      ],
    };

    render(<PoolCard pool={poolWithPrivateData} isPassengerView />);

    expect(screen.queryByText("mem-1")).not.toBeInTheDocument();
    expect(screen.queryByText("ride-req-1")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
