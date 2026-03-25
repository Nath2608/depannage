import * as crypto from 'crypto';

/**
 * Security utility functions for the Depan Express API
 */

// ===========================================
// Input Sanitization
// ===========================================

/**
 * Sanitize a string by removing HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Escape special HTML characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove null bytes
    .replace(/\0/g, '')
    .trim();
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Sanitize a phone number (keep only digits and +)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

// ===========================================
// Token Generation
// ===========================================

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a numeric OTP code
 */
export function generateOtpCode(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i]! % 10];
  }

  return otp;
}

/**
 * Hash a token for storage (one-way hash)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}

// ===========================================
// Rate Limiting Helpers
// ===========================================

/**
 * Generate a rate limit key based on IP and endpoint
 */
export function generateRateLimitKey(ip: string, endpoint: string): string {
  return `rate_limit:${ip}:${endpoint}`;
}

/**
 * Generate a rate limit key for login attempts
 */
export function generateLoginRateLimitKey(email: string): string {
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16);
  return `login_attempts:${emailHash}`;
}

// ===========================================
// Request Fingerprinting
// ===========================================

/**
 * Generate a request fingerprint for tracking suspicious activity
 */
export function generateRequestFingerprint(
  ip: string,
  userAgent: string,
  acceptLanguage?: string,
): string {
  const data = `${ip}:${userAgent}:${acceptLanguage || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// ===========================================
// Data Masking
// ===========================================

/**
 * Mask an email address for display
 * e.g., john.doe@email.com -> j***e@email.com
 */
export function maskEmail(email: string): string {
  if (!email) return '';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedMiddle = '*'.repeat(Math.min(localPart.length - 2, 5));

  return `${firstChar}${maskedMiddle}${lastChar}@${domain}`;
}

/**
 * Mask a phone number for display
 * e.g., +33612345678 -> +33******78
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;

  const visibleStart = phone.slice(0, 3);
  const visibleEnd = phone.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(phone.length - 5, 3));

  return `${visibleStart}${maskedMiddle}${visibleEnd}`;
}

/**
 * Mask a SIRET number for display
 * e.g., 12345678901234 -> 123*****1234
 */
export function maskSiret(siret: string): string {
  if (!siret || siret.length !== 14) return siret;
  return `${siret.slice(0, 3)}${'*'.repeat(7)}${siret.slice(-4)}`;
}

/**
 * Mask an IBAN for display
 * e.g., FR7630001007941234567890185 -> FR76****0185
 */
export function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban;
  return `${iban.slice(0, 4)}${'*'.repeat(Math.min(iban.length - 8, 16))}${iban.slice(-4)}`;
}

// ===========================================
// Validation Helpers
// ===========================================

/**
 * Check if a string contains potential SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)(\s|$)/i,
    /--/,
    /;.*$/,
    /\/\*.*\*\//,
    /'.*OR.*'/i,
    /'.*AND.*'/i,
    /\bOR\b.*=.*=/i,
    /\bAND\b.*=.*=/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input) return false;

  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

// ===========================================
// Password Utilities
// ===========================================

/**
 * Check password strength
 * Returns a score from 0 to 5
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, feedback: ['Mot de passe requis'] };
  }

  // Length checks
  if (password.length >= 8) score++;
  else feedback.push('Au moins 8 caractères requis');

  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres minuscules');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres majuscules');

  if (/\d/.test(password)) score++;
  else feedback.push('Ajoutez des chiffres');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Ajoutez des caractères spéciaux');

  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    score--;
    feedback.push('Trop prévisible (lettres uniquement)');
  }

  if (/^[0-9]+$/.test(password)) {
    score--;
    feedback.push('Trop prévisible (chiffres uniquement)');
  }

  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Évitez les caractères répétés');
  }

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
  };
}
