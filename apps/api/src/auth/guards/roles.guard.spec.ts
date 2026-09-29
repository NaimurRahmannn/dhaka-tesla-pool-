import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/client.js';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class DriverController {
  @Roles('DRIVER')
  driverOnly(): void {}
}

function createContext(role: UserRole): ExecutionContext {
  return {
    getHandler: () => DriverController.prototype.driverOnly,
    getClass: () => DriverController,
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: 'user-id',
          name: 'Jashim',
          email: 'jashim@example.com',
          role,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a user with a matching role', () => {
    const guard = new RolesGuard(new Reflector());

    expect(guard.canActivate(createContext(UserRole.DRIVER))).toBe(true);
  });

  it('rejects a user with a different role', () => {
    const guard = new RolesGuard(new Reflector());

    expect(guard.canActivate(createContext(UserRole.PASSENGER))).toBe(false);
  });
});
