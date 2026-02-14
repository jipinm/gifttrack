/**
 * Security Utilities
 * Functions for token handling, sanitization, and security-related operations
 */

/**
 * JWT Token Payload interface
 */
interface JWTPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  role?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Decode a JWT token without verification (client-side only)
 * Note: This does NOT verify the signature - server still validates
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64Url decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @param bufferSeconds - Seconds before actual expiry to consider expired (default: 60)
 * @returns true if expired or invalid, false if valid
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 60): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp - bufferSeconds;

  return now >= expiresAt;
}

/**
 * Get token expiration time
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Get time until token expires
 * @param token - JWT token string
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiry(token: string | null): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }

  const remaining = expiration - Date.now();
  return Math.max(0, remaining);
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize a string for safe display/storage
 * Removes script tags and dangerous HTML
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove other dangerous tags
    .replace(/<(iframe|object|embed|form|input|meta|link)[^>]*>/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Sanitize a string for plain text display (no HTML allowed)
 * @param input - Input string to sanitize
 * @returns Sanitized plain text
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize a mobile number (remove non-digits except +)
 * @param input - Mobile number input
 * @returns Sanitized mobile number
 */
export function sanitizeMobileNumber(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Keep only digits and optional leading +
  const cleaned = input.replace(/[^\d+]/g, '');
  // Only allow + at the beginning
  return cleaned.startsWith('+') ? '+' + cleaned.slice(1).replace(/\+/g, '') : cleaned.replace(/\+/g, '');
}

/**
 * Sanitize a numeric input
 * @param input - Input that should be numeric
 * @param allowDecimal - Allow decimal points
 * @param allowNegative - Allow negative numbers
 * @returns Sanitized numeric string
 */
export function sanitizeNumericInput(
  input: string | number | null | undefined,
  allowDecimal: boolean = true,
  allowNegative: boolean = false
): string {
  if (input === null || input === undefined) {
    return '';
  }

  const str = String(input);
  let pattern = allowDecimal ? /[^\d.]/g : /[^\d]/g;

  let sanitized = str.replace(pattern, '');

  // Handle negative numbers
  if (allowNegative && str.startsWith('-')) {
    sanitized = '-' + sanitized;
  }

  // Ensure only one decimal point
  if (allowDecimal) {
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
  }

  return sanitized;
}

/**
 * Sanitize object for API submission
 * Recursively sanitizes all string values
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeForApi<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePlainText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizePlainText(item)
          : typeof item === 'object' && item !== null
            ? sanitizeForApi(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForApi(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if input contains potential XSS
 * @param input - Input to check
 * @returns true if suspicious content detected
 */
export function containsSuspiciousContent(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /document\./i,
    /window\./i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate that a string doesn't exceed length limits
 * @param input - Input string
 * @param maxLength - Maximum allowed length
 * @returns true if valid
 */
export function isWithinMaxLength(input: string | null | undefined, maxLength: number): boolean {
  if (!input) {
    return true;
  }
  return input.length <= maxLength;
}

// ============================================================================
// Security Constants
// ============================================================================

export const SECURITY_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
  MAX_MOBILE_LENGTH: 15,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 6,
  MAX_SEARCH_LENGTH: 100,
};

/**
 * Mask sensitive data for logging or display
 * @param value - Value to mask
 * @param visibleChars - Number of chars to keep visible at end
 * @returns Masked string
 */
export function maskSensitiveData(value: string | null | undefined, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '****';
  }

  const masked = '*'.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

/**
 * Mask a mobile number for display
 * @param mobile - Mobile number
 * @returns Masked mobile (e.g., ******4321)
 */
export function maskMobileNumber(mobile: string | null | undefined): string {
  if (!mobile) {
    return '**********';
  }

  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) {
    return '**********';
  }

  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

export default {
  decodeJWT,
  isTokenExpired,
  getTokenExpiration,
  getTimeUntilExpiry,
  sanitizeString,
  sanitizePlainText,
  sanitizeMobileNumber,
  sanitizeNumericInput,
  sanitizeForApi,
  containsSuspiciousContent,
  isWithinMaxLength,
  maskSensitiveData,
  maskMobileNumber,
  SECURITY_LIMITS,
};
