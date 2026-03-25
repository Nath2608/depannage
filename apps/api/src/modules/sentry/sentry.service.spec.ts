import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from './sentry.service';

// Mock Sentry
jest.mock('@sentry/nestjs', () => ({
  withScope: jest.fn((callback) => callback({ setExtra: jest.fn() })),
  captureException: jest.fn(() => 'mock-event-id'),
  captureMessage: jest.fn(() => 'mock-event-id'),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  startSpan: jest.fn((_, callback) => callback()),
}));

describe('SentryService', () => {
  let service: SentryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentryService],
    }).compile();

    service = module.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('captureException', () => {
    it('should capture an exception and return event id', () => {
      const error = new Error('Test error');
      const result = service.captureException(error);

      expect(result).toBeDefined();
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      const result = service.captureException(error, context);

      expect(result).toBeDefined();
    });
  });

  describe('captureMessage', () => {
    it('should capture a message', () => {
      const result = service.captureMessage('Test message', 'info');

      expect(result).toBeDefined();
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const user = { id: '123', email: 'test@test.com', role: 'CLIENT' };

      expect(() => service.setUser(user)).not.toThrow();
    });
  });

  describe('clearUser', () => {
    it('should clear user context', () => {
      expect(() => service.clearUser()).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('should add a breadcrumb', () => {
      const breadcrumb = {
        category: 'test',
        message: 'Test breadcrumb',
        level: 'info' as const,
      };

      expect(() => service.addBreadcrumb(breadcrumb)).not.toThrow();
    });
  });

  describe('trackMetric', () => {
    it('should track a metric', () => {
      expect(() => service.trackMetric('test_metric', 100)).not.toThrow();
    });

    it('should track a metric with tags', () => {
      expect(() =>
        service.trackMetric('test_metric', 100, { environment: 'test' }),
      ).not.toThrow();
    });
  });

  describe('trackPayment', () => {
    it('should track a payment event', () => {
      expect(() =>
        service.trackPayment('pay_123', 100, 'success', 'card'),
      ).not.toThrow();
    });
  });

  describe('trackJob', () => {
    it('should track a job event', () => {
      expect(() => service.trackJob('job_123', 'created')).not.toThrow();
    });

    it('should track a job event with details', () => {
      expect(() =>
        service.trackJob('job_123', 'completed', { duration: 3600 }),
      ).not.toThrow();
    });
  });
});
