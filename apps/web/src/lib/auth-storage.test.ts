import { beforeEach, describe, expect, it } from "vitest";
import { getToken, removeToken, setToken } from "./auth-storage";

describe("auth storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and reads the auth token", () => {
    setToken("jwt-token");

    expect(getToken()).toBe("jwt-token");
  });

  it("removes the auth token", () => {
    setToken("jwt-token");
    removeToken();

    expect(getToken()).toBeNull();
  });
});
