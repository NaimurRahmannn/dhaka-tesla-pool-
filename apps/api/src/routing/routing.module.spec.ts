import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RoutingModule } from './routing.module.js';
import { RoutingService } from './routing.service.js';

describe('RoutingModule', () => {
  it('exposes RoutingService through NestJS dependency injection', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
        }),
        RoutingModule,
      ],
    }).compile();

    expect(module.get(RoutingService)).toBeInstanceOf(RoutingService);

    await module.close();
  });
});
