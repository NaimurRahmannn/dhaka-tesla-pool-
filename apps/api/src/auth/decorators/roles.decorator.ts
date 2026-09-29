import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client.js';
import { ROLES_KEY } from '../auth.constants.js';

export type RoleMetadata = UserRole | 'DRIVER' | 'PASSENGER';

export const Roles = (...roles: RoleMetadata[]) => SetMetadata(ROLES_KEY, roles);
