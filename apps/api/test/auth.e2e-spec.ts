import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  const testCustomer = {
    email: `test.customer.${Date.now()}@email.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+33612345678',
  };

  const testProfessional = {
    email: `test.pro.${Date.now()}@artisan.fr`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Professional',
    phone: '+33698765432',
    tradeType: 'PLUMBING',
    siret: '12345678901234',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customer Registration', () => {
    it('should register a new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register/customer')
        .send(testCustomer)
        .expect(201);

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testCustomer.email);
      expect(response.body.data.user.role).toBe('CLIENT');
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/customer')
        .send(testCustomer)
        .expect(409); // Conflict
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/customer')
        .send({
          ...testCustomer,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/customer')
        .send({
          ...testCustomer,
          email: 'another@email.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('Professional Registration', () => {
    it('should register a new professional', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register/professional')
        .send(testProfessional)
        .expect(201);

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.role).toBe('PROFESSIONAL');
      expect(response.body.data.user.status).toBe('PENDING_VALIDATION');
    });

    it('should fail without SIRET', async () => {
      const { siret, ...withoutSiret } = testProfessional;
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/professional')
        .send({
          ...withoutSiret,
          email: 'another.pro@email.com',
        })
        .expect(400);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testCustomer.email,
          password: testCustomer.password,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testCustomer.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@email.com',
          password: 'somepassword',
        })
        .expect(401);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      // Update tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Get Current User', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', testCustomer.email);
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: testCustomer.email })
        .expect(200);
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@email.com' })
        .expect(200);

      // Should return success even for non-existent email (security)
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should fail to use old refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
