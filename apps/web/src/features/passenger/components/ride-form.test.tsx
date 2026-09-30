import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRide } from "../api/passenger-api";
import { RideForm } from "./ride-form";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("../api/passenger-api", () => ({
  createRide: vi.fn(),
}));

describe("RideForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(createRide).mockReset();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders coordinate fields and submit button", async () => {
    render(<RideForm />);

    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
    expect(screen.getByLabelText("Pickup latitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Pickup longitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination latitude")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination longitude")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request ride" }),
    ).toBeInTheDocument();
  });

  it("pickup selection on map updates state", async () => {
    render(<RideForm />);
    await screen.findByTestId("map-container");

    window.__triggerMapClick?.(23.7937, 90.4043);

    await waitFor(() => {
      expect(screen.getByLabelText("Pickup latitude")).toHaveValue(23.7937);
      expect(screen.getByLabelText("Pickup longitude")).toHaveValue(90.4043);
      expect(screen.getByTestId("selected-pickup-coords")).toHaveTextContent(
        "23.79370, 90.40430",
      );
    });
  });

  it("destination selection on map updates state", async () => {
    render(<RideForm />);
    await screen.findByTestId("map-container");

    // Switch toolbar to destination selection mode
    fireEvent.click(
      screen.getByRole("button", { name: "2. Set Destination" }),
    );

    window.__triggerMapClick?.(23.7925, 90.4078);

    await waitFor(() => {
      expect(screen.getByLabelText("Destination latitude")).toHaveValue(23.7925);
      expect(screen.getByLabelText("Destination longitude")).toHaveValue(90.4078);
      expect(screen.getByTestId("selected-destination-coords")).toHaveTextContent(
        "23.79250, 90.40780",
      );
    });
  });

  it("displays route preview before ride submission", async () => {
    const mockRouteResponse = {
      code: "Ok",
      routes: [
        {
          distance: 3500,
          duration: 600,
          geometry: {
            coordinates: [
              [90.4043, 23.7937],
              [90.4078, 23.7925],
            ],
          },
        },
      ],
    };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(mockRouteResponse)));

    render(<RideForm />);
    await screen.findByTestId("map-container");

    // Select pickup
    window.__triggerMapClick?.(23.7937, 90.4043);

    // Wait for pickup to register and mode to advance
    await waitFor(() => {
      expect(screen.getByLabelText("Pickup latitude")).toHaveValue(23.7937);
    });

    // Select destination
    window.__triggerMapClick?.(23.7925, 90.4078);

    await waitFor(() => {
      expect(screen.getByTestId("route-preview")).toBeInTheDocument();
      expect(screen.getByTestId("route-preview-distance")).toHaveTextContent("3.5 km");
      expect(screen.getByTestId("route-preview-duration")).toHaveTextContent("10 mins");
      expect(screen.getByTestId("route-preview-solo-fare")).toHaveTextContent("BDT 40.00");
      expect(screen.getByTestId("route-preview-pooled-fare")).toHaveTextContent("BDT 32.00");
      expect(screen.getByTestId("route-preview-pool-savings")).toHaveTextContent("Save BDT 8.00");
      expect(screen.getByText("Base BDT 20.00 + BDT 5.00/km (4 km)")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("passenger ride form submits selected coordinates", async () => {
    vi.mocked(createRide).mockResolvedValue({
      id: "ride-map-789",
      status: "REQUESTED",
    });

    render(<RideForm />);
    await screen.findByTestId("map-container");

    // Select pickup on map
    window.__triggerMapClick?.(23.7937, 90.4043);

    // Wait for pickup to register
    await waitFor(() => {
      expect(screen.getByLabelText("Pickup latitude")).toHaveValue(23.7937);
    });

    // Select destination on map
    window.__triggerMapClick?.(23.7925, 90.4078);

    await waitFor(() => {
      expect(screen.getByLabelText("Destination latitude")).toHaveValue(23.7925);
    });

    fireEvent.click(screen.getByRole("button", { name: "Request ride" }));

    await waitFor(() => {
      expect(createRide).toHaveBeenCalledWith({
        pickupLat: 23.7937,
        pickupLng: 90.4043,
        destinationLat: 23.7925,
        destinationLng: 90.4078,
      });
      expect(pushMock).toHaveBeenCalledWith("/passenger/rides/ride-map-789");
    });
  });

  it("submits coordinate data and redirects upon success", async () => {
    vi.mocked(createRide).mockResolvedValue({
      id: "ride-456",
      status: "REQUESTED",
    });

    render(<RideForm />);

    fireEvent.change(screen.getByLabelText("Pickup latitude"), {
      target: { value: "23.7806" },
    });
    fireEvent.change(screen.getByLabelText("Pickup longitude"), {
      target: { value: "90.4074" },
    });
    fireEvent.change(screen.getByLabelText("Destination latitude"), {
      target: { value: "23.8103" },
    });
    fireEvent.change(screen.getByLabelText("Destination longitude"), {
      target: { value: "90.4125" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request ride" }));

    await waitFor(() => {
      expect(createRide).toHaveBeenCalledWith({
        pickupLat: 23.7806,
        pickupLng: 90.4074,
        destinationLat: 23.8103,
        destinationLng: 90.4125,
      });
      expect(pushMock).toHaveBeenCalledWith("/passenger/rides/ride-456");
    });
  });

  it("displays an error message when ride creation fails", async () => {
    vi.mocked(createRide).mockRejectedValue(
      new Error("Pickup coordinates out of service bounds"),
    );

    render(<RideForm />);

    fireEvent.change(screen.getByLabelText("Pickup latitude"), {
      target: { value: "23.7806" },
    });
    fireEvent.change(screen.getByLabelText("Pickup longitude"), {
      target: { value: "90.4074" },
    });
    fireEvent.change(screen.getByLabelText("Destination latitude"), {
      target: { value: "23.8103" },
    });
    fireEvent.change(screen.getByLabelText("Destination longitude"), {
      target: { value: "90.4125" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request ride" }));

    expect(
      await screen.findByText("Pickup coordinates out of service bounds"),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("populates coordinates when clicking a quick route shortcut", () => {
    render(<RideForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Banani to Gulshan 2" }),
    );

    expect(screen.getByLabelText("Pickup latitude")).toHaveValue(23.7937);
    expect(screen.getByLabelText("Pickup longitude")).toHaveValue(90.4043);
    expect(screen.getByLabelText("Destination latitude")).toHaveValue(23.7925);
    expect(screen.getByLabelText("Destination longitude")).toHaveValue(90.4078);
  });

  it("populates coordinates when selecting landmarks from the dropdowns", () => {
    render(<RideForm />);

    const pickupSelect = screen.getByLabelText("Select popular pickup landmark");
    fireEvent.change(pickupSelect, {
      target: { value: "23.869,90.3986" },
    });

    expect(screen.getByLabelText("Pickup latitude")).toHaveValue(23.869);
    expect(screen.getByLabelText("Pickup longitude")).toHaveValue(90.3986);

    const destSelect = screen.getByLabelText(
      "Select popular destination landmark",
    );
    fireEvent.change(destSelect, {
      target: { value: "23.8103,90.4225" },
    });

    expect(screen.getByLabelText("Destination latitude")).toHaveValue(23.8103);
    expect(screen.getByLabelText("Destination longitude")).toHaveValue(90.4225);
  });
});
