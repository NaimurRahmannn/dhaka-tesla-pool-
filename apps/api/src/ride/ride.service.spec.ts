import { Test } from '@nestjs/testing';
import { RideService } from './ride.service.js';

describe('RideService', () => {
  it('is injectable through NestJS dependency injection', async () => {
    const module = await Test.createTestingModule({
      providers: [RideService],
    }).compile();

    expect(module.get(RideService)).toBeInstanceOf(RideService);

    await module.close();
  });
});
