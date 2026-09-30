import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../generated/prisma/client.js';
import type { PublicUser } from '../../users/users.types.js';
import { ROLES_KEY } from '../auth.constants.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly fallbackJwtGuard = new JwtAuthGuard();

  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly jwtAuthGuard?: JwtAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: PublicUser;
      headers?: Record<string, string | string[] | undefined>;
    }>();

    if (request.user?.role) {
      return requiredRoles.includes(request.user.role);
    }

    const authHeader =
      request.headers?.authorization ?? request.headers?.Authorization;

    if (!authHeader) {
      return false;
    }

    return this.authenticateAndAuthorize(context, requiredRoles);
  }

  private async authenticateAndAuthorize(
    context: ExecutionContext,
    requiredRoles: UserRole[],
  ): Promise<boolean> {
    const guard = this.jwtAuthGuard ?? this.fallbackJwtGuard;
    try {
      const canActivateResult = await guard.canActivate(context);
      if (!canActivateResult) {
        return false;
      }
    } catch {
      return false;
    }

    const request = context.switchToHttp().getRequest<{ user?: PublicUser }>();
    const userRole = request.user?.role;

    if (!userRole) {
      return false;
    }

    return requiredRoles.includes(userRole);
  }
}

