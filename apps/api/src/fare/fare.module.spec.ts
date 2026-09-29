import { Test } from '@nestjs/testing';
import { FareModule } from './fare.module.js';
import { FareService } from './fare.service.js';

describe('FareModule', () => {
  it('provides FareService through NestJS dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [FareModule],
    }).compile();

    expect(module.get(FareService)).toBeInstanceOf(FareService);

    await module.close();
  });
});
