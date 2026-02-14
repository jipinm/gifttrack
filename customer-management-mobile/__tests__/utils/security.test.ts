/**
 * Security Utilities Tests
 */
import {
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
} from '../../src/utils/security';

// Sample valid JWT token (for testing - expired)
const sampleToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzxCW7yE';

// Token that expires in the future (mock)
const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const futureToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
  JSON.stringify({ sub: '123', exp: futureExp })
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
)}.signature`;

describe('decodeJWT', () => {
  it('should decode a valid JWT token', () => {
    const result = decodeJWT(sampleToken);
    expect(result).not.toBeNull();
    expect(result?.sub).toBe('1234567890');
  });

  it('should return null for invalid token', () => {
    expect(decodeJWT('')).toBeNull();
    expect(decodeJWT('invalid')).toBeNull();
    expect(decodeJWT('only.two')).toBeNull();
  });

  it('should return null for null input', () => {
    expect(decodeJWT(null as unknown as string)).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('should return true for null token', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it('should return true for expired token', () => {
    expect(isTokenExpired(sampleToken)).toBe(true);
  });

  it('should return true for invalid token', () => {
    expect(isTokenExpired('invalid.token.here')).toBe(true);
  });
});

describe('getTokenExpiration', () => {
  it('should return expiration timestamp', () => {
    const result = getTokenExpiration(sampleToken);
    expect(result).toBe(1516239022000); // exp * 1000
  });

  it('should return null for invalid token', () => {
    expect(getTokenExpiration(null)).toBeNull();
    expect(getTokenExpiration('invalid')).toBeNull();
  });
});

describe('getTimeUntilExpiry', () => {
  it('should return 0 for expired token', () => {
    expect(getTimeUntilExpiry(sampleToken)).toBe(0);
  });

  it('should return 0 for null token', () => {
    expect(getTimeUntilExpiry(null)).toBe(0);
  });
});

// ============================================================================
// Sanitization Tests
// ============================================================================

describe('sanitizeString', () => {
  it('should remove script tags', () => {
    const result = sanitizeString('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('script');
    expect(result).toContain('Hello');
  });

  it('should escape HTML entities', () => {
    const result = sanitizeString('<div>Test</div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should handle null/undefined', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });

  it('should remove javascript: URLs', () => {
    const result = sanitizeString('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });
});

describe('sanitizePlainText', () => {
  it('should remove all HTML tags', () => {
    const result = sanitizePlainText('<p>Hello <b>World</b></p>');
    expect(result).toBe('Hello World');
  });

  it('should handle null/undefined', () => {
    expect(sanitizePlainText(null)).toBe('');
    expect(sanitizePlainText(undefined)).toBe('');
  });
});

describe('sanitizeMobileNumber', () => {
  it('should keep only digits', () => {
    expect(sanitizeMobileNumber('(098) 765-4321')).toBe('0987654321');
  });

  it('should preserve leading +', () => {
    expect(sanitizeMobileNumber('+919876543210')).toBe('+919876543210');
  });

  it('should handle empty input', () => {
    expect(sanitizeMobileNumber('')).toBe('');
    expect(sanitizeMobileNumber(null)).toBe('');
  });
});

describe('sanitizeNumericInput', () => {
  it('should keep only digits by default', () => {
    expect(sanitizeNumericInput('abc123def456')).toBe('123456');
  });

  it('should allow decimal when specified', () => {
    expect(sanitizeNumericInput('12.34', true)).toBe('12.34');
  });

  it('should handle multiple decimals', () => {
    expect(sanitizeNumericInput('12.34.56', true)).toBe('12.3456');
  });

  it('should allow negative when specified', () => {
    expect(sanitizeNumericInput('-123', true, true)).toBe('-123');
  });

  it('should handle null/undefined', () => {
    expect(sanitizeNumericInput(null)).toBe('');
    expect(sanitizeNumericInput(undefined)).toBe('');
  });
});

describe('sanitizeForApi', () => {
  it('should sanitize all string values in object', () => {
    const input = {
      name: '<b>John</b>',
      age: 30,
      active: true,
    };
    const result = sanitizeForApi(input);
    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: '<b>John</b> Doe',
      },
    };
    const result = sanitizeForApi(input);
    expect(result.user.name).toBe('John Doe');
  });

  it('should handle arrays', () => {
    const input = {
      tags: ['<b>tag1</b>', 'tag2'],
    };
    const result = sanitizeForApi(input);
    expect(result.tags[0]).toBe('tag1');
  });
});

describe('containsSuspiciousContent', () => {
  it('should detect script tags', () => {
    expect(containsSuspiciousContent('<script>')).toBe(true);
  });

  it('should detect javascript:', () => {
    expect(containsSuspiciousContent('javascript:void(0)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsSuspiciousContent('onclick="alert(1)"')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(containsSuspiciousContent('Hello World')).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(containsSuspiciousContent(null)).toBe(false);
    expect(containsSuspiciousContent(undefined)).toBe(false);
  });
});

describe('isWithinMaxLength', () => {
  it('should return true for valid length', () => {
    expect(isWithinMaxLength('hello', 10)).toBe(true);
  });

  it('should return false for exceeded length', () => {
    expect(isWithinMaxLength('hello world', 5)).toBe(false);
  });

  it('should return true for null/undefined', () => {
    expect(isWithinMaxLength(null, 10)).toBe(true);
    expect(isWithinMaxLength(undefined, 10)).toBe(true);
  });
});

// ============================================================================
// Masking Tests
// ============================================================================

describe('maskSensitiveData', () => {
  it('should mask data keeping last 4 chars', () => {
    expect(maskSensitiveData('1234567890')).toBe('******7890');
  });

  it('should use custom visible chars', () => {
    expect(maskSensitiveData('abcdefgh', 2)).toBe('******gh');
  });

  it('should handle short values', () => {
    expect(maskSensitiveData('abc')).toBe('****');
  });

  it('should handle null/undefined', () => {
    expect(maskSensitiveData(null)).toBe('****');
    expect(maskSensitiveData(undefined)).toBe('****');
  });
});

describe('maskMobileNumber', () => {
  it('should mask mobile number keeping last 4 digits', () => {
    expect(maskMobileNumber('9876543210')).toBe('******3210');
  });

  it('should handle formatted numbers', () => {
    expect(maskMobileNumber('987-654-3210')).toBe('******3210');
  });

  it('should handle null/undefined', () => {
    expect(maskMobileNumber(null)).toBe('**********');
    expect(maskMobileNumber(undefined)).toBe('**********');
  });
});

describe('SECURITY_LIMITS', () => {
  it('should have required limits defined', () => {
    expect(SECURITY_LIMITS.MAX_NAME_LENGTH).toBe(100);
    expect(SECURITY_LIMITS.MAX_ADDRESS_LENGTH).toBe(500);
    expect(SECURITY_LIMITS.MIN_PASSWORD_LENGTH).toBe(6);
    expect(SECURITY_LIMITS.MAX_MOBILE_LENGTH).toBe(15);
  });
});
