import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    // Determine HTTP status
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only report server errors to Sentry (5xx)
    if (httpStatus >= 500) {
      Sentry.withScope((scope) => {
        // Add request information
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('body', request.body);
        scope.setExtra('query', request.query);
        scope.setExtra('params', request.params);

        // Add user information if available
        if (request.user) {
          scope.setUser({
            id: request.user.id,
            email: request.user.email,
            role: request.user.role,
          });
        }

        // Set fingerprint for better grouping
        scope.setFingerprint([
          request.method,
          request.route?.path || request.url,
          String(httpStatus),
        ]);

        // Capture the exception
        Sentry.captureException(exception);
      });
    }

    // Build response body
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
