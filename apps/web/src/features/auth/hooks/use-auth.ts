"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getToken, removeToken, setToken } from "@/lib/auth-storage";
import type { User } from "@/types";
import { getCurrentUser, login as loginRequest } from "../api/auth-api";
import type {
  AuthContextValue,
  AuthResponse,
  LoginRequest,
} from "../types/auth.types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());

  useEffect(() => {
    if (!token || user) {
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        removeToken();
        setTokenState(null);
        setUser(null);
      });
  }, [token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await loginRequest(credentials);

        setToken(response.accessToken);
        setTokenState(response.accessToken);
        setUser(response.user);

        return response;
      },
      logout: () => {
        removeToken();
        setTokenState(null);
        setUser(null);
      },
    }),
    [user, token],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
