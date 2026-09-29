import { UserRole } from '../generated/prisma/client.js';

export type UserWithPassword = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Pick<UserWithPassword, 'id' | 'name' | 'email' | 'role'>;

export function toPublicUser(user: UserWithPassword): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
