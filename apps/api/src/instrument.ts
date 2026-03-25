import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Ensure this file is imported at the top of your main.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: `depan-express-api@${process.env.npm_package_version || '1.0.0'}`,

  // Enable tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  integrations: [
    nodeProfilingIntegration(),
  ],

  // Configure which errors to ignore
  ignoreErrors: [
    // Ignore common client errors
    'UnauthorizedException',
    'ForbiddenException',
    'NotFoundException',
    // Ignore validation errors
    'BadRequestException',
  ],

  // Add additional context
  beforeSend(event, _hint) {
    // Don't send events in test environment
    if (process.env.NODE_ENV === 'test') {
      return null;
    }

    // Add custom context
    if (event.extra) {
      event.extra.nodeVersion = process.version;
    }

    return event;
  },

  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out health check requests from breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
      return null;
    }
    return breadcrumb;
  },
});
