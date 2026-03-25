import { z } from 'zod';

// ============================================================
// ENVIRONMENT SCHEMA
// ============================================================

export const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // AWS S3
  AWS_REGION: z.string().default('eu-west-3'),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET: z.string(),
  AWS_S3_ENDPOINT: z.string().optional(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@depan-express.fr'),
  EMAIL_FROM_NAME: z.string().default('Depan Express'),

  // API
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_TTL: z.coerce.number().default(60),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Security
  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),

  // Feature Flags
  FEATURE_2FA_ENABLED: z.coerce.boolean().default(true),
  FEATURE_SMS_VERIFICATION: z.coerce.boolean().default(true),
  FEATURE_EMAIL_VERIFICATION: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

// ============================================================
// APP CONSTANTS
// ============================================================

export const APP_CONSTANTS = {
  // Business Rules
  DISPATCH_TIMEOUT_SECONDS: 120,
  MAX_DISPATCH_ATTEMPTS: 5,
  QUOTE_EXPIRY_HOURS: 24,
  DISPUTE_OPENING_DAYS: 7,
  MIN_RATING_FOR_DISPATCH: 3.5,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION_MINUTES: 30,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],

  // Pricing
  DEFAULT_VAT_RATE: 0.2, // 20%
  PLATFORM_FEE_RATE: 0.15, // 15%

  // Geo
  DEFAULT_SEARCH_RADIUS_KM: 15,
  MAX_SEARCH_RADIUS_KM: 50,
  DEFAULT_SPEED_KMH: 30, // For ETA calculation

  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,

  // JWT
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

// ============================================================
// ERROR CODES
// ============================================================

export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_PHONE_NOT_VERIFIED: 'AUTH_PHONE_NOT_VERIFIED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_2FA_REQUIRED: 'AUTH_2FA_REQUIRED',
  AUTH_2FA_INVALID: 'AUTH_2FA_INVALID',

  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_EMAIL_TAKEN: 'USER_EMAIL_TAKEN',
  USER_PHONE_TAKEN: 'USER_PHONE_TAKEN',

  // Professional
  PRO_NOT_FOUND: 'PRO_NOT_FOUND',
  PRO_NOT_APPROVED: 'PRO_NOT_APPROVED',
  PRO_KYC_PENDING: 'PRO_KYC_PENDING',
  PRO_SUSPENDED: 'PRO_SUSPENDED',

  // Service Request
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  REQUEST_ALREADY_ASSIGNED: 'REQUEST_ALREADY_ASSIGNED',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
  REQUEST_EXPIRED: 'REQUEST_EXPIRED',
  NO_PROFESSIONALS_AVAILABLE: 'NO_PROFESSIONALS_AVAILABLE',

  // Job
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_INVALID_STATUS_TRANSITION: 'JOB_INVALID_STATUS_TRANSITION',
  JOB_ALREADY_COMPLETED: 'JOB_ALREADY_COMPLETED',

  // Quote
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_ALREADY_ACCEPTED: 'QUOTE_ALREADY_ACCEPTED',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_ALREADY_CAPTURED: 'PAYMENT_ALREADY_CAPTURED',
  REFUND_FAILED: 'REFUND_FAILED',

  // Dispute
  DISPUTE_NOT_FOUND: 'DISPUTE_NOT_FOUND',
  DISPUTE_ALREADY_RESOLVED: 'DISPUTE_ALREADY_RESOLVED',
  DISPUTE_DEADLINE_PASSED: 'DISPUTE_DEADLINE_PASSED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================
// API ROUTES
// ============================================================

export const API_ROUTES = {
  // Auth
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_PHONE: '/auth/verify-phone',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ENABLE_2FA: '/auth/2fa/enable',
    VERIFY_2FA: '/auth/2fa/verify',
    DISABLE_2FA: '/auth/2fa/disable',
  },

  // Customer
  CUSTOMER: {
    PROFILE: '/customer/profile',
    ADDRESSES: '/customer/addresses',
    REQUESTS: '/customer/requests',
    JOBS: '/customer/jobs',
    INVOICES: '/customer/invoices',
  },

  // Professional
  PROFESSIONAL: {
    ONBOARD: '/professional/onboard',
    PROFILE: '/professional/profile',
    DOCUMENTS: '/professional/documents',
    AVAILABILITY: '/professional/availability',
    SERVICE_AREAS: '/professional/service-areas',
    REQUESTS: '/professional/requests',
    JOBS: '/professional/jobs',
    QUOTES: '/professional/quotes',
    PAYOUTS: '/professional/payouts',
    DASHBOARD: '/professional/dashboard',
  },

  // Admin
  ADMIN: {
    CUSTOMERS: '/admin/customers',
    PROFESSIONALS: '/admin/professionals',
    JOBS: '/admin/jobs',
    DISPUTES: '/admin/disputes',
    REFUNDS: '/admin/refunds',
    DASHBOARD: '/admin/dashboard',
    CONFIG: '/admin/config',
  },
} as const;
