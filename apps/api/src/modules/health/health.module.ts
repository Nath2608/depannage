import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, PrismaHealthIndicator],
})
export class HealthModule {}
