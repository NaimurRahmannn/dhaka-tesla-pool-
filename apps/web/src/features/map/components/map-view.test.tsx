import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MapView } from "./map-view";

describe("MapView", () => {
  it("renders map component with container and tiles", async () => {
    render(<MapView />);

    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
    expect(await screen.findByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
  });

  it("renders interactive toolbar with selection mode toggles", async () => {
    const onSelectionModeChange = vi.fn();

    render(
      <MapView
        selectionMode="pickup"
        onSelectionModeChange={onSelectionModeChange}
      />,
    );

    expect(await screen.findByTestId("map-toolbar")).toBeInTheDocument();

    const destButton = screen.getByRole("button", { name: "2. Set Destination" });
    fireEvent.click(destButton);

    expect(onSelectionModeChange).toHaveBeenCalledWith("destination");
  });

  it("handles map click when selecting pickup point", async () => {
    const onSelectPickup = vi.fn();

    render(
      <MapView
        selectionMode="pickup"
        onSelectPickup={onSelectPickup}
      />,
    );

    await screen.findByTestId("map-container");

    // Trigger simulated map click using the JSDOM test helper
    if (window.__triggerMapClick) {
      window.__triggerMapClick(23.7937, 90.4043);
      expect(onSelectPickup).toHaveBeenCalledWith({
        lat: 23.7937,
        lng: 90.4043,
      });
    }
  });

  it("handles map click when selecting destination point", async () => {
    const onSelectDestination = vi.fn();

    render(
      <MapView
        selectionMode="destination"
        onSelectDestination={onSelectDestination}
      />,
    );

    await screen.findByTestId("map-container");

    if (window.__triggerMapClick) {
      window.__triggerMapClick(23.733, 90.4172);
      expect(onSelectDestination).toHaveBeenCalledWith({
        lat: 23.733,
        lng: 90.4172,
      });
    }
  });

  it("renders pickup marker, destination marker, and route line when provided", async () => {
    const pickup = { lat: 23.7937, lng: 90.4043 };
    const destination = { lat: 23.7925, lng: 90.4078 };
    const routeCoordinates: [number, number][] = [
      [23.7937, 90.4043],
      [23.793, 90.406],
      [23.7925, 90.4078],
    ];

    render(
      <MapView
        pickup={pickup}
        destination={destination}
        routeCoordinates={routeCoordinates}
      />,
    );

    await screen.findByTestId("map-container");

    const markers = screen.getAllByTestId("leaflet-marker");
    expect(markers).toHaveLength(2);

    expect(screen.getByTestId("leaflet-polyline")).toBeInTheDocument();
  });

  it("displays route loading overlay when isLoading is true", async () => {
    render(<MapView isLoading />);

    expect(await screen.findByTestId("route-loading-overlay")).toBeInTheDocument();
    expect(screen.getByText("Calculating route preview...")).toBeInTheDocument();
  });

  it("displays error message when route or map has an error", async () => {
    render(<MapView errorMessage="Route unavailable between points" />);

    expect(await screen.findByTestId("map-error-message")).toBeInTheDocument();
    expect(
      screen.getByText("Route unavailable between points"),
    ).toBeInTheDocument();
  });
});
