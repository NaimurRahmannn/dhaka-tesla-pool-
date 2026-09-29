import { Test } from '@nestjs/testing';
import { FareService } from '../fare/fare.service.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { RideService } from './ride.service.js';

describe('RideService', () => {
  it('is injectable through NestJS dependency injection', async () => {
    const module = await Test.createTestingModule({
      providers: [
        RideService,
        { provide: PrismaService, useValue: {} },
        { provide: RoutingService, useValue: {} },
        { provide: FareService, useValue: {} },
      ],
    }).compile();

    expect(module.get(RideService)).toBeInstanceOf(RideService);

    await module.close();
  });
});
