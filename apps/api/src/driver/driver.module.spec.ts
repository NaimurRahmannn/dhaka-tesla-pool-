import { Test } from '@nestjs/testing';
import { DriverController } from './driver.controller.js';
import { DriverModule } from './driver.module.js';
import { DriverService } from './driver.service.js';

describe('DriverModule', () => {
  it('compiles and provides driver foundation dependencies', async () => {
    const module = await Test.createTestingModule({
      imports: [DriverModule],
    }).compile();

    expect(module.get(DriverService)).toBeInstanceOf(DriverService);
    expect(module.get(DriverController)).toBeInstanceOf(DriverController);

    await module.close();
  });
});
