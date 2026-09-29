import { Injectable } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: input,
    });
  }
}
