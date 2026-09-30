import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, register } from "./auth-api";

const user = {
  id: "user-id",
  name: "Nusrat",
  email: "nusrat@example.test",
  role: "PASSENGER" as const,
};

describe("auth api", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.test";
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the login endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        accessToken: "jwt-token",
        user,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "nusrat@example.test",
        password: "password123",
      }),
    ).resolves.toEqual({
      accessToken: "jwt-token",
      user,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "nusrat@example.test",
          password: "password123",
        }),
      }),
    );
  });

  it("calls the register endpoint", async () => {
    const fetchMock = vi.fn(async () => Response.json(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register({
        name: "Nusrat",
        email: "nusrat@example.test",
        password: "password123",
        role: "PASSENGER",
      }),
    ).resolves.toEqual(user);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Nusrat",
          email: "nusrat@example.test",
          password: "password123",
          role: "PASSENGER",
        }),
      }),
    );
  });
});
