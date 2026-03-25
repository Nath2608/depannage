// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'PROFESSIONAL';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyPhoneRequest {
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface Verify2FARequest {
  code: string;
}

// ============================================================
// CUSTOMER TYPES
// ============================================================

export interface UpdateCustomerProfileRequest {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  marketingConsent?: boolean;
}

export interface CreateAddressRequest {
  label: string;
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  accessNotes?: string;
  isDefault?: boolean;
}

// ============================================================
// SERVICE REQUEST TYPES
// ============================================================

export interface CreateServiceRequestRequest {
  requestedTrade: string;
  problemCategory: string;
  urgencyType: string;
  scheduledFor?: string;
  addressId: string;
  description: string;
  accessNotes?: string;
}

export interface ServiceRequestEstimate {
  priceMin: number;
  priceMax: number;
  etaMinutes: number;
  availableProfessionalsCount: number;
}

// ============================================================
// PROFESSIONAL TYPES
// ============================================================

export interface ProfessionalOnboardingRequest {
  businessName: string;
  firstName: string;
  lastName: string;
  tradeType: string;
  companyType: string;
  siret: string;
  vatNumber?: string;
  yearsOfExperience: number;
  bio?: string;
}

export interface UpdateAvailabilityRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isEmergencySlot: boolean;
}

export interface UpdateServiceAreaRequest {
  city?: string;
  postalCode?: string;
  radiusKm: number;
  latitude: number;
  longitude: number;
}

export interface CreateQuoteRequest {
  jobId: string;
  items: CreateQuoteItemRequest[];
  notes?: string;
}

export interface CreateQuoteItemRequest {
  itemType: string;
  label: string;
  quantity: number;
  unitPrice: number;
}

// ============================================================
// JOB TYPES
// ============================================================

export interface UpdateJobStatusRequest {
  status: string;
}

export interface JobLocationUpdate {
  jobId: string;
  professionalId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

// ============================================================
// DISPUTE TYPES
// ============================================================

export interface OpenDisputeRequest {
  jobId: string;
  reason: string;
  description: string;
}

export interface ResolveDisputeRequest {
  resolutionType: string;
  resolutionNotes?: string;
  refundAmount?: number;
}

// ============================================================
// ADMIN TYPES
// ============================================================

export interface ApproveRejectProfessionalRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface SuspendAccountRequest {
  reason: string;
  durationDays?: number;
}

export interface ReassignJobRequest {
  newProfessionalId: string;
  reason: string;
}

export interface RefundPaymentRequest {
  amount: number;
  reason: string;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface ProfessionalDashboardStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  averageRating: number;
  totalReviews: number;
  acceptanceRate: number;
  averageResponseTimeMinutes: number;
  averageArrivalTimeMinutes: number;
}

export interface AdminDashboardStats {
  totalCustomers: number;
  totalProfessionals: number;
  pendingApprovals: number;
  activeJobs: number;
  completedJobsToday: number;
  gmvToday: number;
  gmvMonth: number;
  openDisputes: number;
  conversionRate: number;
  averageAssignmentTimeMinutes: number;
}
