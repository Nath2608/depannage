import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

export class TestHelper {
  private static app: INestApplication;
  private static prisma: PrismaClient;
  private static accessToken: string;
  private static refreshToken: string;

  static async initialize(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();

    this.prisma = new PrismaClient();
    await this.prisma.$connect();

    return this.app;
  }

  static getApp(): INestApplication {
    return this.app;
  }

  static getPrisma(): PrismaClient {
    return this.prisma;
  }

  static async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.app.close();
  }

  static async cleanDatabase(): Promise<void> {
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  }

  static async loginAsAdmin(): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@depan-express.fr',
        password: 'Admin123!',
      });

    this.accessToken = response.body.data.accessToken;
    this.refreshToken = response.body.data.refreshToken;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  static async loginAsCustomer(
    email = 'test.customer@email.com',
    password = 'Customer123!',
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken,
    };
  }

  static async loginAsProfessional(
    email = 'test.pro@artisan.fr',
    password = 'Pro123!',
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken,
    };
  }

  static async createTestCustomer(): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/register/customer')
      .send({
        email: `test.customer.${Date.now()}@email.com`,
        password: 'Customer123!',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+33612345678',
      });

    return response.body.data;
  }

  static async createTestProfessional(): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/register/professional')
      .send({
        email: `test.pro.${Date.now()}@artisan.fr`,
        password: 'Pro123!',
        firstName: 'Test',
        lastName: 'Pro',
        phone: '+33698765432',
        tradeType: 'PLUMBING',
        siret: '12345678901234',
      });

    return response.body.data;
  }

  static getAuthHeader(token?: string): { Authorization: string } {
    return {
      Authorization: `Bearer ${token || this.accessToken}`,
    };
  }
}
