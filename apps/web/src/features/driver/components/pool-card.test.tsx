import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DriverPool } from "../types/driver.types";
import { PoolCard } from "./pool-card";

describe("PoolCard", () => {
  it("renders pool information correctly", () => {
    const mockPool: DriverPool = {
      id: "pool-abc-456",
      status: "ACTIVE",
      vehicleId: "veh-tesla-bullet",
      memberCount: 3,
    };

    render(<PoolCard pool={mockPool} />);

    expect(screen.getByText("pool-abc-456")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("veh-tesla-bullet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Pool" })).toHaveAttribute(
      "href",
      "/driver/pools",
    );
  });
});
