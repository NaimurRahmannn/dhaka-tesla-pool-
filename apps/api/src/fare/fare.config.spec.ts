import {
  baseFarePaisa,
  poolDiscountPercent,
  pricePerKmPaisa,
} from './fare.config.js';

describe('fare configuration', () => {
  it('centralizes the current fare model placeholders', () => {
    expect({
      baseFarePaisa,
      pricePerKmPaisa,
      poolDiscountPercent,
    }).toEqual({
      baseFarePaisa: 2000,
      pricePerKmPaisa: 500,
      poolDiscountPercent: 20,
    });
  });
});
