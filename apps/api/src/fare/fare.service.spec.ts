import { FareService } from './fare.service.js';

describe('FareService', () => {
  it('can be instantiated without domain or persistence dependencies', () => {
    expect(new FareService()).toBeInstanceOf(FareService);
  });
});
