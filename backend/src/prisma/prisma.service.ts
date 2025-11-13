import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error: any) {
      // Don't crash the whole application during local development if DB isn't available.
      // Log the error and continue. Production deployments should ensure DATABASE_URL is valid.
      // Prisma throws a PrismaClientInitializationError when authentication fails; surface a concise message.
      console.warn('[Prisma] Could not connect to the database:', error?.message || error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
