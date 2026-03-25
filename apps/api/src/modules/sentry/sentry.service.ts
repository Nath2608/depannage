import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  /**
   * Capture an exception and send it to Sentry
   */
  captureException(exception: Error, context?: Record<string, any>): string {
    return Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      return Sentry.captureException(exception);
    });
  }

  /**
   * Capture a message and send it to Sentry
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>,
  ): string {
    return Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      return Sentry.captureMessage(message, level);
    });
  }

  /**
   * Set user context for all subsequent events
   */
  setUser(user: { id: string; email?: string; role?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set a tag for all subsequent events
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Set extra context data
   */
  setExtra(key: string, value: any): void {
    Sentry.setExtra(key, value);
  }

  /**
   * Start a new performance span
   */
  startSpan<T>(
    name: string,
    op: string,
    callback: () => T | Promise<T>,
  ): T | Promise<T> {
    return Sentry.startSpan(
      {
        name,
        op,
      },
      callback,
    );
  }

  /**
   * Track a business metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    // Using breadcrumbs for metrics in basic Sentry
    this.addBreadcrumb({
      category: 'metric',
      message: name,
      level: 'info',
      data: {
        value,
        ...tags,
      },
    });

    this.logger.debug(`Metric tracked: ${name} = ${value}`);
  }

  /**
   * Track a payment event
   */
  trackPayment(
    paymentId: string,
    amount: number,
    status: 'success' | 'failure' | 'pending',
    method: string,
  ): void {
    this.addBreadcrumb({
      category: 'payment',
      message: `Payment ${paymentId} - ${status}`,
      level: status === 'failure' ? 'error' : 'info',
      data: {
        paymentId,
        amount,
        status,
        method,
      },
    });
  }

  /**
   * Track a job/mission event
   */
  trackJob(
    jobId: string,
    event: 'created' | 'started' | 'completed' | 'cancelled',
    details?: Record<string, any>,
  ): void {
    this.addBreadcrumb({
      category: 'job',
      message: `Job ${jobId} - ${event}`,
      level: 'info',
      data: {
        jobId,
        event,
        ...details,
      },
    });
  }
}
