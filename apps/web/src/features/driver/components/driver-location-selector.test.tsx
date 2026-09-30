import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriverLocationSelector } from "./driver-location-selector";

describe("DriverLocationSelector", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders default hub and allows changing location to another Dhaka Hub", () => {
    const onLocationChange = vi.fn();
    render(<DriverLocationSelector onLocationChange={onLocationChange} />);

    expect(screen.getByText("Driver Current Location")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Banani (Road 11)" }),
    ).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Lalbagh Fort" } });

    expect(
      screen.getByRole("heading", { name: "Lalbagh Fort" }),
    ).toBeInTheDocument();
    expect(screen.getByText("South & Old Dhaka")).toBeInTheDocument();
    expect(onLocationChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Lalbagh Fort" }),
    );
  });
});
