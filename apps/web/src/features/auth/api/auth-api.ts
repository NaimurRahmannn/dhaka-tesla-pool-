import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth.types";

export function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", credentials, {
    skipAuth: true,
  });
}

export function register(payload: RegisterRequest): Promise<User> {
  return apiClient.post<User>("/auth/register", payload, {
    skipAuth: true,
  });
}

export function getCurrentUser(): Promise<User> {
  return apiClient.get<User>("/auth/me");
}
