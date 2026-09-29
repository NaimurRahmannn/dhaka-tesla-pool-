import { Injectable } from '@nestjs/common';
import {
  baseFarePaisa,
  poolDiscountPercent,
  pricePerKmPaisa,
} from './fare.config.js';
import { CalculateFareDto } from './dto/calculate-fare.dto.js';
import type { FareBreakdown } from './interfaces/fare-breakdown.interface.js';

@Injectable()
export class FareService {
  calculateFare({
    distanceMeter,
    isPooled,
  }: CalculateFareDto): FareBreakdown {
    if (distanceMeter < 0) {
      throw new RangeError('distanceMeter must be non-negative');
    }

    const distanceKilometer = Math.ceil(distanceMeter / 1000);
    const distanceChargePaisa = distanceKilometer * pricePerKmPaisa;
    const subtotalPaisa = baseFarePaisa + distanceChargePaisa;
    const poolDiscountPaisa = isPooled
      ? (subtotalPaisa * poolDiscountPercent) / 100
      : 0;

    return {
      baseFarePaisa,
      distanceChargePaisa,
      subtotalPaisa,
      poolDiscountPaisa,
      finalFarePaisa: subtotalPaisa - poolDiscountPaisa,
    };
  }
}
