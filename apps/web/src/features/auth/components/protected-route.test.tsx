import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./protected-route";

const mocks = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    user: null as { role: "PASSENGER" | "DRIVER" } | null,
  },
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

vi.mock("../hooks/use-auth", () => ({
  useAuth: () => mocks.authState,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mocks.authState.isAuthenticated = false;
    mocks.authState.user = null;
    mocks.replace.mockReset();
  });

  it("redirects unauthenticated users to login", async () => {
    render(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    mocks.authState.isAuthenticated = true;

    render(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects authenticated users with the wrong role", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.authState.user = {
      role: "DRIVER",
    };

    render(
      <ProtectedRoute requiredRole="PASSENGER">
        <p>Passenger content</p>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/driver");
    });
    expect(screen.queryByText("Passenger content")).not.toBeInTheDocument();
  });

  it("redirects passengers attempting to access driver-only routes", async () => {
    mocks.authState.isAuthenticated = true;
    mocks.authState.user = {
      role: "PASSENGER",
    };

    render(
      <ProtectedRoute requiredRole="DRIVER">
        <p>Driver content</p>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/passenger");
    });
    expect(screen.queryByText("Driver content")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users with the required role", () => {
    mocks.authState.isAuthenticated = true;
    mocks.authState.user = {
      role: "PASSENGER",
    };

    render(
      <ProtectedRoute requiredRole="PASSENGER">
        <p>Passenger content</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Passenger content")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("renders children for authenticated drivers accessing driver routes", () => {
    mocks.authState.isAuthenticated = true;
    mocks.authState.user = {
      role: "DRIVER",
    };

    render(
      <ProtectedRoute requiredRole="DRIVER">
        <p>Driver workspace</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Driver workspace")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
