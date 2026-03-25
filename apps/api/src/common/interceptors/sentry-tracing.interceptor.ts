import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryTracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, route, user } = request;

    // Start a span for this request
    return Sentry.startSpan(
      {
        name: `${method} ${route?.path || url}`,
        op: 'http.server',
        attributes: {
          'http.method': method,
          'http.url': url,
          'http.route': route?.path,
        },
      },
      () => {
        // Set user context if available
        if (user) {
          Sentry.setUser({
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }

        const now = Date.now();

        return next.handle().pipe(
          tap({
            next: () => {
              // Add breadcrumb on success
              Sentry.addBreadcrumb({
                category: 'http',
                message: `${method} ${url}`,
                level: 'info',
                data: {
                  duration: Date.now() - now,
                  statusCode: context.switchToHttp().getResponse().statusCode,
                },
              });
            },
            error: (error) => {
              // Add breadcrumb on error
              Sentry.addBreadcrumb({
                category: 'http',
                message: `${method} ${url} - Error`,
                level: 'error',
                data: {
                  duration: Date.now() - now,
                  error: error.message,
                },
              });
            },
          }),
        );
      },
    );
  }
}
