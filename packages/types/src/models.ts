import {
  UserRole,
  UserStatus,
  TradeType,
  CompanyType,
  ApprovalStatus,
  DocumentType,
  DocumentVerificationStatus,
  BankAccountVerificationStatus,
  UrgencyType,
  ProblemCategory,
  ServiceRequestStatus,
  JobStatus,
  AssignmentStatus,
  MediaType,
  QuoteStatus,
  QuoteItemType,
  PaymentStatus,
  PaymentProvider,
  PayoutStatus,
  RefundStatus,
  Currency,
  DisputeReason,
  DisputeStatus,
  ResolutionType,
  DayOfWeek,
} from './enums';

// ============================================================
// BASE INTERFACES
// ============================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
}

// ============================================================
// USER & AUTH
// ============================================================

export interface User extends SoftDeleteEntity {
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
}

export interface UserSession extends BaseEntity {
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface OtpCode extends BaseEntity {
  userId: string;
  channel: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

// ============================================================
// CUSTOMER PROFILE
// ============================================================

export interface CustomerProfile extends BaseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  defaultAddressId: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  marketingConsent: boolean;
  termsAcceptedAt: Date;
  privacyAcceptedAt: Date;
}

export interface UserAddress extends BaseEntity {
  userId: string;
  label: string;
  streetLine1: string;
  streetLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  accessNotes: string | null;
  isDefault: boolean;
}

// ============================================================
// PROFESSIONAL PROFILE
// ============================================================

export interface ProfessionalProfile extends BaseEntity {
  userId: string;
  businessName: string;
  firstName: string;
  lastName: string;
  tradeType: TradeType;
  companyType: CompanyType;
  siret: string;
  vatNumber: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: Date | null;
  yearsOfExperience: number;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobCount: number;
  isKycVerified: boolean;
  isBackgroundChecked: boolean;
  isActiveForDispatch: boolean;
  approvalStatus: ApprovalStatus;
  approvedAt: Date | null;
}

export interface ProfessionalSpecialty extends BaseEntity {
  professionalId: string;
  specialtyCode: string;
}

export interface ProfessionalServiceArea extends BaseEntity {
  professionalId: string;
  city: string | null;
  postalCode: string | null;
  radiusKm: number;
  latitude: number;
  longitude: number;
}

export interface ProfessionalAvailability extends BaseEntity {
  professionalId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isEmergencySlot: boolean;
}

export interface ProfessionalDocument extends BaseEntity {
  professionalId: string;
  documentType: DocumentType;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: DocumentVerificationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  expiresAt: Date | null;
}

export interface ProfessionalBankAccount extends BaseEntity {
  professionalId: string;
  provider: PaymentProvider;
  providerAccountId: string;
  ibanLast4: string;
  accountHolderName: string;
  isDefault: boolean;
  verificationStatus: BankAccountVerificationStatus;
}

// ============================================================
// SERVICE REQUESTS & JOBS
// ============================================================

export interface ServiceRequest extends BaseEntity {
  customerId: string;
  requestedTrade: TradeType;
  problemCategory: ProblemCategory;
  urgencyType: UrgencyType;
  scheduledFor: Date | null;
  addressId: string;
  description: string;
  accessNotes: string | null;
  status: ServiceRequestStatus;
  estimatedPriceMin: number | null;
  estimatedPriceMax: number | null;
  estimatedEtaMinutes: number | null;
  assignedProfessionalId: string | null;
  cancelledAt: Date | null;
}

export interface ServiceRequestMedia extends BaseEntity {
  requestId: string;
  uploadedByUserId: string;
  mediaType: MediaType;
  storageKey: string;
}

export interface JobAssignment extends BaseEntity {
  requestId: string;
  professionalId: string;
  assignmentStatus: AssignmentStatus;
  assignedAt: Date;
  respondedAt: Date | null;
  responseReason: string | null;
}

export interface Job extends BaseEntity {
  requestId: string;
  customerId: string;
  professionalId: string;
  jobStatus: JobStatus;
  acceptedAt: Date | null;
  enRouteAt: Date | null;
  arrivedAt: Date | null;
  diagnosisStartedAt: Date | null;
  workStartedAt: Date | null;
  workCompletedAt: Date | null;
  cancelledAt: Date | null;
}

// ============================================================
// QUOTES & INVOICES
// ============================================================

export interface Quote extends BaseEntity {
  jobId: string;
  professionalId: string;
  customerId: string;
  status: QuoteStatus;
  travelFee: number;
  laborFee: number;
  partsFee: number;
  surchargeFee: number;
  vatAmount: number;
  totalAmount: number;
  currency: Currency;
  notes: string | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  signedDocumentKey: string | null;
}

export interface QuoteItem extends BaseEntity {
  quoteId: string;
  itemType: QuoteItemType;
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice extends BaseEntity {
  jobId: string;
  quoteId: string | null;
  invoiceNumber: string;
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
  pdfStorageKey: string | null;
  issuedAt: Date;
}

// ============================================================
// PAYMENTS
// ============================================================

export interface PaymentIntent extends BaseEntity {
  jobId: string;
  customerId: string;
  provider: PaymentProvider;
  providerPaymentIntentId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  cancelledAt: Date | null;
}

export interface Payout extends BaseEntity {
  professionalId: string;
  provider: PaymentProvider;
  providerPayoutId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: Currency;
  status: PayoutStatus;
  paidAt: Date | null;
}

export interface Refund extends BaseEntity {
  paymentIntentId: string;
  disputeId: string | null;
  providerRefundId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
}

// ============================================================
// REVIEWS & DISPUTES
// ============================================================

export interface Review extends BaseEntity {
  jobId: string;
  customerId: string;
  professionalId: string;
  rating: number;
  comment: string | null;
}

export interface Dispute extends BaseEntity {
  jobId: string;
  openedByUserId: string;
  disputeReason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolutionType: ResolutionType | null;
  resolutionNotes: string | null;
  openedAt: Date;
  resolvedAt: Date | null;
}

export interface DisputeEvidence extends BaseEntity {
  disputeId: string;
  uploadedByUserId: string;
  storageKey: string;
  mediaType: MediaType;
}

// ============================================================
// AUDIT & SECURITY
// ============================================================

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  userId: string | null;
  eventType: string;
  severity: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
