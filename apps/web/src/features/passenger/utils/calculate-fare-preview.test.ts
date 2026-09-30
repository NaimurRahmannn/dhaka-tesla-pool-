import { describe, expect, it } from "vitest";
import { calculateFarePreview } from "./calculate-fare-preview";

describe("calculateFarePreview", () => {
  it("matches the backend fare model for a two-kilometer ride", () => {
    expect(calculateFarePreview(2000)).toEqual({
      distanceKilometer: 2,
      soloFarePaisa: 3000,
      poolDiscountPaisa: 600,
      pooledFarePaisa: 2400,
    });
  });

  it("rounds route distance up to the next started kilometer", () => {
    expect(calculateFarePreview(3500)).toEqual({
      distanceKilometer: 4,
      soloFarePaisa: 4000,
      poolDiscountPaisa: 800,
      pooledFarePaisa: 3200,
    });
  });
});
