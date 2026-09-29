import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/client.js';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class DriverController {
  @Roles('DRIVER')
  driverOnly(): void {}
}

class SharedRideController {
  @Roles('DRIVER', 'PASSENGER')
  sharedAccess(): void {}
}

function createContext(
  role: UserRole | undefined,
  handler: () => void,
  controller: object,
): ExecutionContext {
  const request = role
    ? {
        user: {
          id: 'user-id',
          name: 'Jashim',
          email: 'jashim@example.com',
          role,
        },
      }
    : {};

  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a user with a matching role', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(
        createContext(
          UserRole.DRIVER,
          DriverController.prototype.driverOnly,
          DriverController,
        ),
      ),
    ).toBe(true);
  });

  it('rejects a user with a different role', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(
        createContext(
          UserRole.PASSENGER,
          DriverController.prototype.driverOnly,
          DriverController,
        ),
      ),
    ).toBe(false);
  });

  it('rejects a request without an authenticated user', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(
        createContext(
          undefined,
          DriverController.prototype.driverOnly,
          DriverController,
        ),
      ),
    ).toBe(false);
  });

  it('allows a driver when multiple roles are required', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(
        createContext(
          UserRole.DRIVER,
          SharedRideController.prototype.sharedAccess,
          SharedRideController,
        ),
      ),
    ).toBe(true);
  });

  it('allows a passenger when multiple roles are required', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(
        createContext(
          UserRole.PASSENGER,
          SharedRideController.prototype.sharedAccess,
          SharedRideController,
        ),
      ),
    ).toBe(true);
  });
});
