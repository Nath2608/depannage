// ============================================================
// USER & AUTH ENUMS
// ============================================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export enum OtpChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// ============================================================
// PROFESSIONAL ENUMS
// ============================================================

export enum TradeType {
  PLUMBING = 'PLUMBING',
  LOCKSMITH = 'LOCKSMITH',
}

export enum CompanyType {
  AUTO_ENTREPRENEUR = 'AUTO_ENTREPRENEUR',
  EURL = 'EURL',
  SARL = 'SARL',
  SAS = 'SAS',
  SASU = 'SASU',
  EI = 'EI',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum DocumentType {
  IDENTITY_CARD = 'IDENTITY_CARD',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  KBIS = 'KBIS',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  PROFESSIONAL_CARD = 'PROFESSIONAL_CARD',
  DIPLOMA = 'DIPLOMA',
}

export enum DocumentVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum BankAccountVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

// ============================================================
// PLUMBING SPECIALTIES
// ============================================================

export enum PlumbingSpecialty {
  LEAK_REPAIR = 'LEAK_REPAIR',
  PIPE_UNCLOGGING = 'PIPE_UNCLOGGING',
  WATER_HEATER = 'WATER_HEATER',
  TOILET_REPAIR = 'TOILET_REPAIR',
  FAUCET_INSTALLATION = 'FAUCET_INSTALLATION',
  BATHROOM_INSTALLATION = 'BATHROOM_INSTALLATION',
  WATER_METER = 'WATER_METER',
  SEWER_LINE = 'SEWER_LINE',
  EMERGENCY_SHUTOFF = 'EMERGENCY_SHUTOFF',
}

// ============================================================
// LOCKSMITH SPECIALTIES
// ============================================================

export enum LocksmithSpecialty {
  DOOR_OPENING = 'DOOR_OPENING',
  LOCK_CHANGE = 'LOCK_CHANGE',
  LOCK_REPAIR = 'LOCK_REPAIR',
  KEY_DUPLICATION = 'KEY_DUPLICATION',
  ARMORED_DOOR = 'ARMORED_DOOR',
  SAFE_OPENING = 'SAFE_OPENING',
  CYLINDER_REPLACEMENT = 'CYLINDER_REPLACEMENT',
  DIGITAL_LOCK = 'DIGITAL_LOCK',
  EMERGENCY_LOCKOUT = 'EMERGENCY_LOCKOUT',
}

// ============================================================
// SERVICE REQUEST ENUMS
// ============================================================

export enum UrgencyType {
  EMERGENCY = 'EMERGENCY',
  SCHEDULED = 'SCHEDULED',
}

export enum ProblemCategory {
  // Plumbing
  WATER_LEAK = 'WATER_LEAK',
  CLOGGED_DRAIN = 'CLOGGED_DRAIN',
  NO_HOT_WATER = 'NO_HOT_WATER',
  TOILET_ISSUE = 'TOILET_ISSUE',
  FAUCET_PROBLEM = 'FAUCET_PROBLEM',
  WATER_HEATER_MALFUNCTION = 'WATER_HEATER_MALFUNCTION',
  PIPE_BURST = 'PIPE_BURST',
  LOW_WATER_PRESSURE = 'LOW_WATER_PRESSURE',
  OTHER_PLUMBING = 'OTHER_PLUMBING',

  // Locksmith
  LOCKED_OUT = 'LOCKED_OUT',
  BROKEN_LOCK = 'BROKEN_LOCK',
  LOST_KEYS = 'LOST_KEYS',
  BURGLARY_DAMAGE = 'BURGLARY_DAMAGE',
  KEY_STUCK = 'KEY_STUCK',
  DOOR_NOT_CLOSING = 'DOOR_NOT_CLOSING',
  UPGRADE_SECURITY = 'UPGRADE_SECURITY',
  OTHER_LOCKSMITH = 'OTHER_LOCKSMITH',
}

export enum ServiceRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  SEARCHING = 'SEARCHING',
  ASSIGNED = 'ASSIGNED',
  NO_PROFESSIONAL_AVAILABLE = 'NO_PROFESSIONAL_AVAILABLE',
  CANCELLED_BY_CUSTOMER = 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_SYSTEM = 'CANCELLED_BY_SYSTEM',
  EXPIRED = 'EXPIRED',
}

// ============================================================
// JOB ENUMS
// ============================================================

export enum JobStatus {
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  DIAGNOSIS = 'DIAGNOSIS',
  QUOTE_SENT = 'QUOTE_SENT',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED_BY_CUSTOMER = 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_PROFESSIONAL = 'CANCELLED_BY_PROFESSIONAL',
  CANCELLED_BY_ADMIN = 'CANCELLED_BY_ADMIN',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

// ============================================================
// QUOTE & PAYMENT ENUMS
// ============================================================

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum QuoteItemType {
  TRAVEL = 'TRAVEL',
  LABOR = 'LABOR',
  PARTS = 'PARTS',
  SURCHARGE_NIGHT = 'SURCHARGE_NIGHT',
  SURCHARGE_WEEKEND = 'SURCHARGE_WEEKEND',
  SURCHARGE_HOLIDAY = 'SURCHARGE_HOLIDAY',
  SURCHARGE_EMERGENCY = 'SURCHARGE_EMERGENCY',
  DISCOUNT = 'DISCOUNT',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export enum Currency {
  EUR = 'EUR',
}

// ============================================================
// DISPUTE ENUMS
// ============================================================

export enum DisputeReason {
  POOR_QUALITY = 'POOR_QUALITY',
  INCOMPLETE_WORK = 'INCOMPLETE_WORK',
  OVERCHARGED = 'OVERCHARGED',
  PROFESSIONAL_NO_SHOW = 'PROFESSIONAL_NO_SHOW',
  DAMAGE_CAUSED = 'DAMAGE_CAUSED',
  UNPROFESSIONAL_BEHAVIOR = 'UNPROFESSIONAL_BEHAVIOR',
  WRONG_DIAGNOSIS = 'WRONG_DIAGNOSIS',
  UNAUTHORIZED_WORK = 'UNAUTHORIZED_WORK',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPENED = 'OPENED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AWAITING_CUSTOMER_RESPONSE = 'AWAITING_CUSTOMER_RESPONSE',
  AWAITING_PROFESSIONAL_RESPONSE = 'AWAITING_PROFESSIONAL_RESPONSE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ResolutionType {
  REJECTED = 'REJECTED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  FULL_REFUND = 'FULL_REFUND',
  PROFESSIONAL_RETURN = 'PROFESSIONAL_RETURN',
  CREDIT_ISSUED = 'CREDIT_ISSUED',
  MEDIATED = 'MEDIATED',
}

// ============================================================
// AUDIT & SECURITY ENUMS
// ============================================================

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  SUSPENSION = 'SUSPENSION',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FA_ENABLED = 'TWO_FA_ENABLED',
  TWO_FA_DISABLED = 'TWO_FA_DISABLED',
  TWO_FA_VERIFIED = 'TWO_FA_VERIFIED',
  TWO_FA_FAILED = 'TWO_FA_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_REVOKED = 'SESSION_REVOKED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
}

export enum SecurityEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ============================================================
// DAY OF WEEK
// ============================================================

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// ============================================================
// NOTIFICATION ENUMS
// ============================================================

export enum NotificationType {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationCategory {
  REQUEST_UPDATE = 'REQUEST_UPDATE',
  JOB_UPDATE = 'JOB_UPDATE',
  QUOTE = 'QUOTE',
  PAYMENT = 'PAYMENT',
  REVIEW = 'REVIEW',
  DISPUTE = 'DISPUTE',
  ACCOUNT = 'ACCOUNT',
  MARKETING = 'MARKETING',
  SYSTEM = 'SYSTEM',
}
