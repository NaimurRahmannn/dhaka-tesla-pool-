import { UserRole } from '../generated/prisma/client.js';
import { ROLES_KEY } from '../auth/auth.constants.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RideController } from './ride.controller.js';

describe('RideController authorization', () => {
  it('protects ride creation with JWT authentication and passenger role metadata', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      RideController.prototype.create,
    ) as Array<new (...args: never[]) => unknown>;

    expect(guards).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(ROLES_KEY, RideController.prototype.create),
    ).toEqual([UserRole.PASSENGER]);
  });

  it.each([
    ['list', RideController.prototype.list],
    ['getById', RideController.prototype.getById],
    ['cancel', RideController.prototype.cancel],
  ])(
    'protects %s with JWT authentication and passenger role metadata',
    (_name, handler) => {
      const guards = Reflect.getMetadata(
        '__guards__',
        handler,
      ) as Array<new (...args: never[]) => unknown>;

      expect(guards).toContain(JwtAuthGuard);
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        UserRole.PASSENGER,
      ]);
    },
  );
});
