import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from '@common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { ProfessionalsModule } from '@modules/professionals/professionals.module';
import { ServiceRequestsModule } from '@modules/service-requests/service-requests.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { QuotesModule } from '@modules/quotes/quotes.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { DisputesModule } from '@modules/disputes/disputes.module';
import { AdminModule } from '@modules/admin/admin.module';
import { WebsocketModule } from '@modules/websocket/websocket.module';
import { HealthModule } from '@modules/health/health.module';
import { SentryModule } from '@modules/sentry/sentry.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    // Monitoring
    SentryModule,
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CustomersModule,
    ProfessionalsModule,
    ServiceRequestsModule,
    JobsModule,
    QuotesModule,
    PaymentsModule,
    DisputesModule,
    AdminModule,
    WebsocketModule,
  ],
})
export class AppModule {}
