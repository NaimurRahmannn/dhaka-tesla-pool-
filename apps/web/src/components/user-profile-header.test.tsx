import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserProfileHeader } from "./user-profile-header";

const mockPush = vi.fn();
const mockLogout = vi.fn();

let mockUser: { name: string; email: string; role: "PASSENGER" | "DRIVER" } | null = {
  name: "Nusrat Passenger",
  email: "nusrat@example.com",
  role: "PASSENGER",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: Boolean(mockUser),
  }),
}));

describe("UserProfileHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      name: "Nusrat Passenger",
      email: "nusrat@example.com",
      role: "PASSENGER",
    };
  });

  it("renders profile icon, user name, and passenger role badge", () => {
    render(<UserProfileHeader />);

    expect(screen.getByTestId("profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Nusrat Passenger");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Passenger");
    expect(screen.getByText("nusrat@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  it("renders driver role badge for a driver user", () => {
    mockUser = {
      name: "Jashim Driver",
      email: "jashim@tesla-pool.local",
      role: "DRIVER",
    };

    render(<UserProfileHeader />);

    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Jashim Driver");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Driver");
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  it("calls logout and redirects to /login on logout button click", () => {
    render(<UserProfileHeader />);

    const logoutBtn = screen.getByTestId("logout-button");
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("handles empty user state gracefully with fallback text", () => {
    mockUser = null;

    render(<UserProfileHeader />);

    expect(screen.getByTestId("profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Dhaka Tesla User");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Passenger");
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });
});
