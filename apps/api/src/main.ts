// Sentry must be imported before any other imports
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { SentryExceptionFilter } from '@common/filters/sentry-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { SentryTracingInterceptor } from '@common/interceptors/sentry-tracing.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new SentryExceptionFilter(httpAdapterHost),
    new HttpExceptionFilter(),
  );
  app.useGlobalInterceptors(
    new SentryTracingInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger - Available in all environments
  const config = new DocumentBuilder()
    .setTitle('Depan Express API')
    .setDescription(`
## API de dépannage à domicile - Plomberie & Serrurerie

Cette API permet de gérer l'ensemble de la plateforme Depan Express:
- **Authentification** avec JWT (access + refresh tokens)
- **Clients** - Inscription, profil, demandes de service
- **Professionnels** - Inscription, validation, disponibilité, missions
- **Demandes** - Création, devis, acceptation
- **Missions** - Suivi en temps réel, paiements
- **Admin** - Gestion complète de la plateforme

### Authentification
Utilisez le endpoint \`/auth/login\` pour obtenir un token JWT.
Incluez ce token dans le header \`Authorization: Bearer <token>\` pour les requêtes authentifiées.

### Rate Limiting
- Endpoints publics: 100 requêtes/minute
- Login: 5 tentatives/minute
- Endpoints authentifiés: 200 requêtes/minute
    `)
    .setVersion('1.0')
    .setContact('Depan Express', 'https://depanexpress.fr', 'api@depanexpress.fr')
    .setLicense('Proprietary', 'https://depanexpress.fr/terms')
    .addServer('http://localhost:3000', 'Développement local')
    .addServer('https://api.staging.depanexpress.fr', 'Staging')
    .addServer('https://api.depanexpress.fr', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Token JWT obtenu via /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Vérification de l\'état des services')
    .addTag('Auth', 'Authentification et gestion des sessions')
    .addTag('Customers', 'Gestion des clients')
    .addTag('Professionals', 'Gestion des professionnels')
    .addTag('Service Requests', 'Demandes de service client')
    .addTag('Quotes', 'Devis envoyés par les professionnels')
    .addTag('Jobs', 'Missions de dépannage')
    .addTag('Payments', 'Paiements et transactions')
    .addTag('Reviews', 'Avis et évaluations')
    .addTag('Notifications', 'Notifications push et in-app')
    .addTag('Disputes', 'Gestion des litiges')
    .addTag('Admin', 'Endpoints d\'administration')
    .addTag('Admin - Dashboard', 'Statistiques et KPIs')
    .addTag('Admin - Users', 'Gestion des utilisateurs')
    .addTag('Admin - Reports', 'Rapports et exports')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Depan Express API Documentation',
    customfavIcon: '/favicon.ico',
  });

  const port = process.env.API_PORT || 3000;
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Application is running on: http://${host}:${port}`);
  console.log(`📚 Swagger documentation: http://${host}:${port}/api/docs`);
  console.log(`❤️ Health check: http://${host}:${port}/api/v1/health`);
}

bootstrap();
