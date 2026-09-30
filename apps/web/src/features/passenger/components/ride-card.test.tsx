import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Ride } from "../types/passenger.types";
import { RideCard } from "./ride-card";

describe("RideCard", () => {
  it("renders ride details and a link to ride details page", () => {
    const ride: Ride = {
      id: "ride-abc-123",
      status: "REQUESTED",
      pickupLat: 23.7806,
      pickupLng: 90.4074,
      destinationLat: 23.8103,
      destinationLng: 90.4125,
      estimatedFarePaisa: 8500,
    };

    render(<RideCard ride={ride} />);

    expect(screen.getByText("Ride ride-abc-123")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("BDT 85.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/passenger/rides/ride-abc-123",
    );
  });

  it("renders pooled ride badge, split discount badge, and vehicle name when ride is pooled", () => {
    const ride: Ride = {
      id: "ride-pool-456",
      status: "MATCHED",
      pickupLat: 23.7806,
      pickupLng: 90.4074,
      destinationLat: 23.8103,
      destinationLng: 90.4125,
      estimatedFarePaisa: 6000,
      farePaisa: 4800,
      poolId: "pool-789",
      pool: {
        id: "pool-789",
        status: "ACTIVE",
        vehicleName: "Bullet Tesla",
        capacity: 3,
        memberCount: 2,
      },
    };

    render(<RideCard ride={ride} />);

    expect(screen.getByText("Pooled (Bullet Tesla)")).toBeInTheDocument();
    expect(screen.getByText("Your pooled fare")).toBeInTheDocument();
    expect(screen.getByText("BDT 48.00")).toBeInTheDocument();
    expect(screen.getByText("20% Split")).toBeInTheDocument();
    expect(screen.getByText("Vehicle: Bullet Tesla")).toBeInTheDocument();
  });
});
