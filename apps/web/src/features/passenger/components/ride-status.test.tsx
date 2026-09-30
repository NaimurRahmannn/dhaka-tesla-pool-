import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RideStatus as RideStatusType } from "../types/passenger.types";
import { RideStatus } from "./ride-status";

describe("RideStatus", () => {
  it("renders a readable ride status label for all ride states", () => {
    const statuses: Array<{ status: RideStatusType; expected: string }> = [
      { status: "REQUESTED", expected: "Requested" },
      { status: "MATCHED", expected: "Matched" },
      { status: "DRIVER_ARRIVED", expected: "Driver arrived" },
      { status: "STARTED", expected: "Started" },
      { status: "COMPLETED", expected: "Completed" },
      { status: "CANCELLED", expected: "Cancelled" },
    ];

    for (const { status, expected } of statuses) {
      const { unmount } = render(<RideStatus status={status} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    }
  });
});
