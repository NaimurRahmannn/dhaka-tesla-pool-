import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./protected-route";

const mocks = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
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
});
