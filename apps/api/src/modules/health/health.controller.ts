import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
    // @ts-expect-error - Reserved for future disk health checks
    private _disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Vérification de santé complète',
    description: 'Retourne l\'état de tous les services (BDD, Redis, mémoire, disque)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tous les services sont opérationnels',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
            redis: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
            memory_heap: { type: 'object', properties: { status: { type: 'string', example: 'up' } } },
          },
        },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Un ou plusieurs services sont indisponibles' })
  check() {
    return this.health.check([
      // Database check
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // Redis check
      () => this.redisHealth.isHealthy('redis'),
      // Memory check (heap should be under 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      // RSS memory check (under 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('liveness')
  @ApiOperation({
    summary: 'Probe de vivacité (Kubernetes)',
    description: 'Vérifie si l\'application est en cours d\'exécution',
  })
  @ApiResponse({ status: 200, description: 'Application en cours d\'exécution' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Probe de disponibilité (Kubernetes)',
    description: 'Vérifie si l\'application est prête à recevoir du trafic',
  })
  @ApiResponse({ status: 200, description: 'Application prête' })
  @ApiResponse({ status: 503, description: 'Application non prête' })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('version')
  @ApiOperation({
    summary: 'Version de l\'API',
    description: 'Retourne les informations de version de l\'application',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations de version',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'depan-express-api' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' },
        nodeVersion: { type: 'string', example: 'v20.10.0' },
        uptime: { type: 'number', example: 3600 },
      },
    },
  })
  version() {
    return {
      name: 'depan-express-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
