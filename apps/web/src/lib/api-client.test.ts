import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiClientError } from "./api-client";

describe("api client errors", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses backend error messages when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            message: "Pool capacity exceeded",
            statusCode: 400,
          },
          {
            status: 400,
          },
        ),
      ),
    );

    await expect(apiRequest("/driver/rides/ride-id/accept")).rejects.toThrow(
      new ApiClientError("Pool capacity exceeded", 400, {
        message: "Pool capacity exceeded",
        statusCode: 400,
      }),
    );
  });
});
