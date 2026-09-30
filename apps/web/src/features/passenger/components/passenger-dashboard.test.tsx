import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRides } from "../api/passenger-api";
import { PassengerDashboard } from "./passenger-dashboard";

vi.mock("@/features/auth", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      name: "Nusrat",
      email: "nusrat@example.com",
      role: "PASSENGER",
    },
  }),
}));

vi.mock("../api/passenger-api", () => ({
  getRides: vi.fn(),
}));

describe("PassengerDashboard", () => {
  beforeEach(() => {
    vi.mocked(getRides).mockReset();
  });

  it("renders a list of rides for the passenger", async () => {
    vi.mocked(getRides).mockResolvedValue([
      {
        id: "ride-1",
        status: "REQUESTED",
        estimatedFarePaisa: 5000,
      },
      {
        id: "ride-2",
        status: "COMPLETED",
        estimatedFarePaisa: 6000,
      },
    ]);

    render(<PassengerDashboard />);

    expect(await screen.findByText("Ride ride-1")).toBeInTheDocument();
    expect(screen.getByText("Ride ride-2")).toBeInTheDocument();
  });

  it("renders empty state when there are no rides", async () => {
    vi.mocked(getRides).mockResolvedValue([]);

    render(<PassengerDashboard />);

    expect(await screen.findByText("No rides yet.")).toBeInTheDocument();
  });

  it("renders error message when loading rides fails", async () => {
    vi.mocked(getRides).mockRejectedValue(new Error("Network connection failed"));

    render(<PassengerDashboard />);

    expect(
      await screen.findByText("Network connection failed"),
    ).toBeInTheDocument();
  });

  it("renders profile icon and logout button in header", async () => {
    vi.mocked(getRides).mockResolvedValue([]);

    render(<PassengerDashboard />);

    expect(screen.getByTestId("profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Nusrat");
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });
});
