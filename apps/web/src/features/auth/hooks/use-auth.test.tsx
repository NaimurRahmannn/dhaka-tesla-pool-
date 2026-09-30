import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./use-auth";
import { getCurrentUser, login as loginRequest } from "../api/auth-api";

vi.mock("../api/auth-api", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

const user = {
  id: "passenger-id",
  name: "Nusrat",
  email: "nusrat@example.test",
  role: "PASSENGER" as const,
};

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <p>{auth.isAuthenticated ? "authenticated" : "guest"}</p>
      <p>{auth.user?.name ?? "no user"}</p>
      <button
        type="button"
        onClick={() =>
          void auth.login({
            email: "nusrat@example.test",
            password: "password123",
          })
        }
      >
        Login
      </button>
      <button type="button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(loginRequest).mockReset();
  });

  it("updates auth state after login and logout", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "jwt-token",
      user,
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText("guest")).toBeInTheDocument();
    expect(screen.getByText("no user")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("Nusrat")).toBeInTheDocument();
    expect(window.localStorage.getItem("dhaka_tesla_pool_access_token")).toBe(
      "jwt-token",
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByText("guest")).toBeInTheDocument();
    expect(screen.getByText("no user")).toBeInTheDocument();
    expect(
      window.localStorage.getItem("dhaka_tesla_pool_access_token"),
    ).toBeNull();
  });
});
