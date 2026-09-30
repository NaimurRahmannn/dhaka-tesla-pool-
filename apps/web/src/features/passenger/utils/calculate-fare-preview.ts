export const previewBaseFarePaisa = 2000;
export const previewPricePerKmPaisa = 500;
export const previewPoolDiscountPercent = 20;

export interface FarePreview {
  distanceKilometer: number;
  soloFarePaisa: number;
  poolDiscountPaisa: number;
  pooledFarePaisa: number;
}

export function calculateFarePreview(distanceMeter: number): FarePreview {
  const distanceKilometer = Math.ceil(distanceMeter / 1000);
  const distanceChargePaisa = distanceKilometer * previewPricePerKmPaisa;
  const soloFarePaisa = previewBaseFarePaisa + distanceChargePaisa;
  const poolDiscountPaisa = Math.floor(
    (soloFarePaisa * previewPoolDiscountPercent) / 100,
  );

  return {
    distanceKilometer,
    soloFarePaisa,
    poolDiscountPaisa,
    pooledFarePaisa: soloFarePaisa - poolDiscountPaisa,
  };
}
