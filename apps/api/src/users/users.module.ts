import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { UsersService } from './users.service.js';

@Module({
  providers: [PrismaService, UsersService],
  exports: [PrismaService, UsersService],
})
export class UsersModule {}
