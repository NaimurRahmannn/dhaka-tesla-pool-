import { Module } from '@nestjs/common';
import { FareService } from './fare.service.js';

@Module({
  providers: [FareService],
  exports: [FareService],
})
export class FareModule {}
