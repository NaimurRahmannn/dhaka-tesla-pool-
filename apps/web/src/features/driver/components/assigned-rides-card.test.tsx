import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AssignedRide } from "../types/driver.types";
import { AssignedRidesCard } from "./assigned-rides-card";

describe("AssignedRidesCard", () => {
  const mockRides: AssignedRide[] = [
    {
      id: "ride-matched-1",
      passengerId: "p-1",
      passengerName: "Nusrat",
      pickupLat: 23.7937,
      pickupLng: 90.4043,
      destinationLat: 23.733,
      destinationLng: 90.4172,
      status: "MATCHED",
      requestedSeats: 1,
      farePaisa: 35000,
      poolId: "pool-1",
      createdAt: "2026-09-30T10:00:00Z",
    },
    {
      id: "ride-arrived-2",
      passengerId: "p-2",
      passengerName: "Rafiq",
      pickupLat: 23.7925,
      pickupLng: 90.4078,
      destinationLat: 23.7323,
      destinationLng: 90.4116,
      status: "DRIVER_ARRIVED",
      requestedSeats: 2,
      farePaisa: 60000,
      poolId: "pool-1",
      createdAt: "2026-09-30T10:05:00Z",
    },
    {
      id: "ride-started-3",
      passengerId: "p-3",
      passengerName: "Shirin",
      pickupLat: 23.7797,
      pickupLng: 90.4184,
      destinationLat: 23.738,
      destinationLng: 90.3957,
      status: "STARTED",
      requestedSeats: 1,
      farePaisa: 40000,
      poolId: "pool-1",
      createdAt: "2026-09-30T10:10:00Z",
    },
  ];

  it("renders empty state when there are no assigned rides", () => {
    render(
      <AssignedRidesCard
        assignedRides={[]}
        isLoading={false}
        actionRideId={null}
        errorMessage={null}
        onArrive={vi.fn()}
        onStart={vi.fn()}
        onComplete={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No active rides currently assigned"),
    ).toBeInTheDocument();
  });

  it("renders assigned rides with appropriate action buttons for their statuses", () => {
    const onArrive = vi.fn();
    const onStart = vi.fn();
    const onComplete = vi.fn();

    render(
      <AssignedRidesCard
        assignedRides={mockRides}
        isLoading={false}
        actionRideId={null}
        errorMessage={null}
        onArrive={onArrive}
        onStart={onStart}
        onComplete={onComplete}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Nusrat")).toBeInTheDocument();
    expect(screen.getByText("Rafiq")).toBeInTheDocument();
    expect(screen.getByText("Shirin")).toBeInTheDocument();

    const arriveBtn = screen.getByRole("button", { name: "Arrived at Pickup" });
    const startBtn = screen.getByRole("button", { name: "Start Ride" });
    const completeBtn = screen.getByRole("button", { name: "Complete Ride" });

    expect(arriveBtn).toBeInTheDocument();
    expect(startBtn).toBeInTheDocument();
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(arriveBtn);
    expect(onArrive).toHaveBeenCalledWith("ride-matched-1");

    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledWith("ride-arrived-2");

    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledWith("ride-started-3");
  });
});
