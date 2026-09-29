import { Test } from '@nestjs/testing';
import { DriverController } from './driver.controller.js';
import { DriverVehicleService } from './driver-vehicle.service.js';
import { DriverModule } from './driver.module.js';
import { DriverService } from './driver.service.js';
import { PrismaService } from '../users/prisma.service.js';

describe('DriverModule', () => {
  it('compiles and provides driver foundation dependencies', async () => {
    const module = await Test.createTestingModule({
      imports: [DriverModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module.get(DriverService)).toBeInstanceOf(DriverService);
    expect(module.get(DriverVehicleService)).toBeInstanceOf(
      DriverVehicleService,
    );
    expect(module.get(DriverController)).toBeInstanceOf(DriverController);

    await module.close();
  });
});
