import { APP_GUARD } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { DriverModule } from './driver/driver.module.js';
import { FareModule } from './fare/fare.module.js';
import { RoutingModule } from './routing/routing.module.js';
import { RideModule } from './ride/ride.module.js';

describe('AppModule authorization guard wiring', () => {
  it('registers only RolesGuard as a global guard', () => {
    const providers = Reflect.getMetadata('providers', AppModule) as unknown[];

    expect(providers).toContainEqual({
      provide: APP_GUARD,
      useClass: RolesGuard,
    });
    expect(providers).not.toContainEqual({
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    });
  });
});

describe('AppModule routing wiring', () => {
  it('imports the routing module', () => {
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];

    expect(imports).toContain(RoutingModule);
    expect(imports).toContain(FareModule);
    expect(imports).toContain(RideModule);
    expect(imports).toContain(DriverModule);
  });
});
