import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { FareService } from '../fare/fare.service.js';
import { RoutingService } from '../routing/routing.service.js';
import { PrismaService } from '../users/prisma.service.js';
import { RideModule } from './ride.module.js';
import { RideService } from './ride.service.js';
import { RideTransitionService } from './ride-transition.service.js';

describe('RideModule', () => {
  it('compiles and provides RideService through dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
        }),
        RideModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(RoutingService)
      .useValue({})
      .overrideProvider(FareService)
      .useValue({})
      .compile();

    expect(module.get(RideService)).toBeInstanceOf(RideService);
    expect(module.get(RideTransitionService)).toBeInstanceOf(
      RideTransitionService,
    );

    await module.close();
  });
});
