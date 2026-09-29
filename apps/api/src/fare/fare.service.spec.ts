import { Test, TestingModule } from '@nestjs/testing';
import { CalculateFareDto } from './dto/calculate-fare.dto.js';
import { FareService } from './fare.service.js';

describe('FareService', () => {
  let module: TestingModule;
  let fareService: FareService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [FareService],
    }).compile();

    fareService = module.get(FareService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('is created through NestJS dependency injection', async () => {
    expect(fareService).toBeInstanceOf(FareService);
  });

  it('calculates a normal ride fare in paisa', () => {
    expect(fareService.calculateFare(new CalculateFareDto(10000, false))).toEqual({
      baseFarePaisa: 2000,
      distanceChargePaisa: 5000,
      subtotalPaisa: 7000,
      poolDiscountPaisa: 0,
      finalFarePaisa: 7000,
    });
  });

  it('applies the pool discount to a pooled ride', () => {
    expect(fareService.calculateFare(new CalculateFareDto(10000, true))).toEqual({
      baseFarePaisa: 2000,
      distanceChargePaisa: 5000,
      subtotalPaisa: 7000,
      poolDiscountPaisa: 1400,
      finalFarePaisa: 5600,
    });
  });

  it('rounds partial kilometers up when calculating distance charges', () => {
    expect(fareService.calculateFare(new CalculateFareDto(5230, false))).toEqual({
      baseFarePaisa: 2000,
      distanceChargePaisa: 3000,
      subtotalPaisa: 5000,
      poolDiscountPaisa: 0,
      finalFarePaisa: 5000,
    });
  });

  it('charges only the base fare for zero distance', () => {
    expect(fareService.calculateFare(new CalculateFareDto(0, false))).toEqual({
      baseFarePaisa: 2000,
      distanceChargePaisa: 0,
      subtotalPaisa: 2000,
      poolDiscountPaisa: 0,
      finalFarePaisa: 2000,
    });
  });

  it('returns only integer paisa values', () => {
    const fareBreakdown = fareService.calculateFare(
      new CalculateFareDto(5230, true),
    );

    expect(Object.values(fareBreakdown).every(Number.isInteger)).toBe(true);
  });

  it('rejects negative distance', () => {
    expect(() =>
      fareService.calculateFare(new CalculateFareDto(-1, false)),
    ).toThrow('distanceMeter must be non-negative');
  });
});
