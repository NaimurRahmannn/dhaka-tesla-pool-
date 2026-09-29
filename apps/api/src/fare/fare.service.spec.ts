import { Test } from '@nestjs/testing';
import { FareService } from './fare.service.js';

describe('FareService', () => {
  it('is created through NestJS dependency injection', async () => {
    const module = await Test.createTestingModule({
      providers: [FareService],
    }).compile();

    expect(module.get(FareService)).toBeInstanceOf(FareService);

    await module.close();
  });
});
