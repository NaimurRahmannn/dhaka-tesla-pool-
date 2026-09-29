import { Module } from '@nestjs/common';
import { ROUTING_CLIENT } from './routing.constants.js';
import { OsrmClient } from './osrm.client.js';
import { RoutingService } from './routing.service.js';

@Module({
  providers: [
    OsrmClient,
    RoutingService,
    {
      provide: ROUTING_CLIENT,
      useExisting: OsrmClient,
    },
  ],
  exports: [RoutingService],
})
export class RoutingModule {}
