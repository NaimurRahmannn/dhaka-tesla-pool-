import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { NearbyRide } from "../types/driver.types";
import { NearbyRidesSection } from "./nearby-rides-section";

describe("NearbyRidesSection", () => {
  const mockNearby: NearbyRide[] = [
    {
      id: "nearby-1",
      passengerId: "p-1",
      passengerName: "Karim",
      pickupLat: 23.7937,
      pickupLng: 90.4043,
      destinationLat: 23.733,
      destinationLng: 90.4172,
      status: "REQUESTED",
      requestedSeats: 1,
      estimatedFarePaisa: 35000,
      distanceMeter: 450,
      createdAt: "2026-09-30T10:00:00Z",
    },
  ];

  it("prompts the driver to go online if vehicle is offline", () => {
    render(
      <NearbyRidesSection
        nearbyRides={[]}
        isLoading={false}
        isAssigning={false}
        isOnline={false}
        currentLocationName="Banani (Road 11)"
        errorMessage={null}
        onAccept={vi.fn()}
        onAutoAssign={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Vehicle is currently OFFLINE")).toBeInTheDocument();
  });

  it("renders nearby ride card with distance badge and accept button", () => {
    const onAccept = vi.fn();
    const onAutoAssign = vi.fn();

    render(
      <NearbyRidesSection
        nearbyRides={mockNearby}
        isLoading={false}
        isAssigning={false}
        isOnline={true}
        currentLocationName="Banani (Road 11)"
        errorMessage={null}
        onAccept={onAccept}
        onAutoAssign={onAutoAssign}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Karim")).toBeInTheDocument();
    expect(screen.getByText(/450m away/)).toBeInTheDocument();

    const acceptBtn = screen.getByRole("button", { name: "Accept Ride" });
    const autoAssignBtn = screen.getByRole("button", { name: /Auto-Assign/ });

    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith("nearby-1");

    fireEvent.click(autoAssignBtn);
    expect(onAutoAssign).toHaveBeenCalled();
  });
});
