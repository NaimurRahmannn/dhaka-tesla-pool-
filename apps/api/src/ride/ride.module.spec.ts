import { Test } from '@nestjs/testing';
import { RideModule } from './ride.module.js';
import { RideService } from './ride.service.js';

describe('RideModule', () => {
  it('compiles and provides RideService through dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [RideModule],
    }).compile();

    expect(module.get(RideService)).toBeInstanceOf(RideService);

    await module.close();
  });
});
