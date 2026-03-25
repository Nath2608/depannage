// ============================================================
// WEBSOCKET EVENT TYPES
// ============================================================

export enum WebSocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Request lifecycle
  REQUEST_CREATED = 'request.created',
  REQUEST_ASSIGNED = 'request.assigned',
  REQUEST_CANCELLED = 'request.cancelled',

  // Job lifecycle
  JOB_CREATED = 'job.created',
  JOB_STATUS_UPDATED = 'job.status.updated',
  JOB_CANCELLED = 'job.cancelled',

  // Professional location
  PRO_LOCATION_UPDATED = 'pro.location.updated',

  // Quote
  QUOTE_SENT = 'quote.sent',
  QUOTE_ACCEPTED = 'quote.accepted',
  QUOTE_REJECTED = 'quote.rejected',

  // Payment
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',

  // Dispute
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_UPDATED = 'dispute.updated',
  DISPUTE_RESOLVED = 'dispute.resolved',

  // Chat
  CHAT_MESSAGE = 'chat.message',
  CHAT_TYPING = 'chat.typing',
}

// ============================================================
// WEBSOCKET PAYLOAD TYPES
// ============================================================

export interface WsBasePayload {
  timestamp: string;
}

export interface WsRequestCreatedPayload extends WsBasePayload {
  requestId: string;
  customerId: string;
  trade: string;
  problemCategory: string;
  urgencyType: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
}

export interface WsRequestAssignedPayload extends WsBasePayload {
  requestId: string;
  customerId: string;
  professionalId: string;
  professionalName: string;
  professionalRating: number;
  estimatedArrivalMinutes: number;
}

export interface WsJobStatusUpdatedPayload extends WsBasePayload {
  jobId: string;
  requestId: string;
  customerId: string;
  professionalId: string;
  previousStatus: string;
  newStatus: string;
}

export interface WsProLocationUpdatedPayload extends WsBasePayload {
  jobId: string;
  professionalId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  estimatedArrivalMinutes: number;
}

export interface WsQuoteSentPayload extends WsBasePayload {
  quoteId: string;
  jobId: string;
  customerId: string;
  professionalId: string;
  totalAmount: number;
  currency: string;
}

export interface WsQuoteAcceptedPayload extends WsBasePayload {
  quoteId: string;
  jobId: string;
  customerId: string;
  professionalId: string;
}

export interface WsPaymentCapturedPayload extends WsBasePayload {
  paymentIntentId: string;
  jobId: string;
  customerId: string;
  professionalId: string;
  amount: number;
  currency: string;
}

export interface WsDisputeOpenedPayload extends WsBasePayload {
  disputeId: string;
  jobId: string;
  openedByUserId: string;
  reason: string;
}

export interface WsChatMessagePayload extends WsBasePayload {
  messageId: string;
  jobId: string;
  senderId: string;
  senderRole: string;
  content: string;
  mediaUrl?: string;
}

// ============================================================
// WEBSOCKET ROOMS
// ============================================================

export enum WsRoom {
  // Customer rooms
  CUSTOMER_PREFIX = 'customer:',

  // Professional rooms
  PROFESSIONAL_PREFIX = 'pro:',

  // Job-specific rooms
  JOB_PREFIX = 'job:',

  // Admin rooms
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_DISPUTES = 'admin:disputes',
}

export const getCustomerRoom = (userId: string): string =>
  `${WsRoom.CUSTOMER_PREFIX}${userId}`;

export const getProfessionalRoom = (userId: string): string =>
  `${WsRoom.PROFESSIONAL_PREFIX}${userId}`;

export const getJobRoom = (jobId: string): string =>
  `${WsRoom.JOB_PREFIX}${jobId}`;
