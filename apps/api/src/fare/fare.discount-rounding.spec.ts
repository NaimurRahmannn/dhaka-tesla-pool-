import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

vi.mock('./fare.config.js', () => ({
  baseFarePaisa: 2001,
  poolDiscountPercent: 20,
  pricePerKmPaisa: 500,
}));

const { CalculateFareDto } = await import('./dto/calculate-fare.dto.js');
const { FareService } = await import('./fare.service.js');

describe('FareService discount rounding', () => {
  let module: TestingModule;
  let fareService: InstanceType<typeof FareService>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [FareService],
    }).compile();

    fareService = module.get(FareService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('floors fractional pool discounts to integer paisa', () => {
    const fareBreakdown = fareService.calculateFare(
      new CalculateFareDto(9000, true),
    );

    expect(fareBreakdown).toEqual({
      baseFarePaisa: 2001,
      distanceChargePaisa: 4500,
      subtotalPaisa: 6501,
      poolDiscountPaisa: 1300,
      finalFarePaisa: 5201,
    });
  });
});
