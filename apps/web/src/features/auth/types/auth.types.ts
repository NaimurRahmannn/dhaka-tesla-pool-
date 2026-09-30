import type { User, UserRole } from "@/types";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
};
