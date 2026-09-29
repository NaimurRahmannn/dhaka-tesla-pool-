import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '../../users/users.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser =>
    context.switchToHttp().getRequest<{ user: PublicUser }>().user,
);
