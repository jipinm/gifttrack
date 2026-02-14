/**
 * Validation Utilities Tests
 */
import {
  validateMobileNumber,
  validatePassword,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateEmail,
  validateLength,
  validateName,
  combineValidations,
} from '../../src/utils/validation';

describe('validateMobileNumber', () => {
  it('should return valid for 10-digit number starting with 6-9', () => {
    expect(validateMobileNumber('9876543210').isValid).toBe(true);
    expect(validateMobileNumber('8765432109').isValid).toBe(true);
    expect(validateMobileNumber('7654321098').isValid).toBe(true);
    expect(validateMobileNumber('6543210987').isValid).toBe(true);
  });

  it('should return invalid for empty input', () => {
    const result = validateMobileNumber('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mobile number is required');
  });

  it('should return invalid for less than 10 digits', () => {
    const result = validateMobileNumber('987654321');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mobile number must be exactly 10 digits');
  });

  it('should return invalid for more than 10 digits', () => {
    const result = validateMobileNumber('98765432101');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mobile number must be exactly 10 digits');
  });

  it('should return invalid for numbers starting with 0-5', () => {
    const result = validateMobileNumber('5876543210');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mobile number must start with 6, 7, 8, or 9');
  });

  it('should handle numbers with spaces or dashes', () => {
    expect(validateMobileNumber('987 654 3210').isValid).toBe(true);
    expect(validateMobileNumber('987-654-3210').isValid).toBe(true);
  });
});

describe('validatePassword', () => {
  it('should return valid for password with minimum length', () => {
    expect(validatePassword('password').isValid).toBe(true);
  });

  it('should return invalid for empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required');
  });

  it('should return invalid for password shorter than minimum', () => {
    const result = validatePassword('pass', 6);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters');
  });

  it('should respect custom minimum length', () => {
    expect(validatePassword('pass', 4).isValid).toBe(true);
    expect(validatePassword('pass', 5).isValid).toBe(false);
  });

  it('should validate complexity when required', () => {
    // Missing uppercase
    let result = validatePassword('password1!', 6, true);
    expect(result.isValid).toBe(false);

    // Missing number
    result = validatePassword('Password!', 6, true);
    expect(result.isValid).toBe(false);

    // Valid complex password
    result = validatePassword('Password1!', 6, true);
    expect(result.isValid).toBe(true);
  });
});

describe('validateRequired', () => {
  it('should return valid for non-empty string', () => {
    expect(validateRequired('value', 'Field').isValid).toBe(true);
  });

  it('should return valid for number including 0', () => {
    expect(validateRequired(0, 'Field').isValid).toBe(true);
    expect(validateRequired(123, 'Field').isValid).toBe(true);
  });

  it('should return invalid for null or undefined', () => {
    expect(validateRequired(null, 'Field').isValid).toBe(false);
    expect(validateRequired(undefined, 'Field').isValid).toBe(false);
  });

  it('should return invalid for empty string', () => {
    const result = validateRequired('', 'Name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should return invalid for whitespace-only string', () => {
    expect(validateRequired('   ', 'Field').isValid).toBe(false);
  });
});

describe('validateDate', () => {
  it('should return valid for valid date', () => {
    expect(validateDate(new Date()).isValid).toBe(true);
    expect(validateDate('2024-01-15').isValid).toBe(true);
  });

  it('should return invalid for null or undefined', () => {
    expect(validateDate(null).isValid).toBe(false);
    expect(validateDate(undefined).isValid).toBe(false);
  });

  it('should return invalid for invalid date string', () => {
    expect(validateDate('invalid-date').isValid).toBe(false);
  });

  it('should validate min date constraint', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const result = validateDate(yesterday, { minDate: today });
    expect(result.isValid).toBe(false);
  });

  it('should validate max date constraint', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = validateDate(tomorrow, { maxDate: today });
    expect(result.isValid).toBe(false);
  });
});

describe('validatePositiveNumber', () => {
  it('should return valid for positive numbers', () => {
    expect(validatePositiveNumber(1).isValid).toBe(true);
    expect(validatePositiveNumber(100).isValid).toBe(true);
    expect(validatePositiveNumber(0.5).isValid).toBe(true);
  });

  it('should return valid for zero (min defaults to 0)', () => {
    // Default min is 0, so 0 is valid
    expect(validatePositiveNumber(0, 'Value').isValid).toBe(true);
  });

  it('should return invalid for negative numbers', () => {
    expect(validatePositiveNumber(-1).isValid).toBe(false);
  });

  it('should return invalid for null/undefined', () => {
    expect(validatePositiveNumber(null).isValid).toBe(false);
    expect(validatePositiveNumber(undefined).isValid).toBe(false);
  });

  it('should parse string numbers', () => {
    expect(validatePositiveNumber('100').isValid).toBe(true);
    expect(validatePositiveNumber('-50').isValid).toBe(false);
  });

  it('should allow zero when specified', () => {
    expect(validatePositiveNumber(0, true).isValid).toBe(true);
  });
});

describe('validateEmail', () => {
  it('should return valid for proper email format', () => {
    expect(validateEmail('test@example.com').isValid).toBe(true);
    expect(validateEmail('user.name@domain.co.in').isValid).toBe(true);
  });

  it('should return invalid for missing @', () => {
    expect(validateEmail('testexample.com').isValid).toBe(false);
  });

  it('should return invalid for missing domain', () => {
    expect(validateEmail('test@').isValid).toBe(false);
  });

  it('should return valid for empty input when not required', () => {
    expect(validateEmail('').isValid).toBe(true);
    expect(validateEmail('', true).isValid).toBe(false);
  });
});

describe('validateLength', () => {
  it('should validate minimum length', () => {
    expect(validateLength('ab', 'Field', { minLength: 3 }).isValid).toBe(false);
    expect(validateLength('abc', 'Field', { minLength: 3 }).isValid).toBe(true);
  });

  it('should validate maximum length', () => {
    expect(validateLength('abcde', 'Field', { maxLength: 4 }).isValid).toBe(false);
    expect(validateLength('abcd', 'Field', { maxLength: 4 }).isValid).toBe(true);
  });

  it('should validate both min and max', () => {
    expect(validateLength('ab', 'Field', { minLength: 3, maxLength: 5 }).isValid).toBe(false);
    expect(validateLength('abcdef', 'Field', { minLength: 3, maxLength: 5 }).isValid).toBe(false);
    expect(validateLength('abcd', 'Field', { minLength: 3, maxLength: 5 }).isValid).toBe(true);
  });
});

describe('validateName', () => {
  it('should return valid for proper names', () => {
    expect(validateName('John Doe').isValid).toBe(true);
    expect(validateName('Jane').isValid).toBe(true);
  });

  it('should return invalid for empty name', () => {
    expect(validateName('').isValid).toBe(false);
  });

  it('should return invalid for name with only numbers', () => {
    expect(validateName('12345').isValid).toBe(false);
  });

  it('should allow names with special characters', () => {
    expect(validateName("O'Connor").isValid).toBe(true);
    expect(validateName('Mary-Jane').isValid).toBe(true);
  });
});

describe('combineValidations', () => {
  it('should return valid when all validations pass', () => {
    const result = combineValidations(
      validateRequired('value', 'Field'),
      validateLength('value', { min: 3, max: 10 })
    );
    expect(result.isValid).toBe(true);
  });

  it('should return first error when validation fails', () => {
    const result = combineValidations(
      validateRequired('', 'Name'),
      validateLength('', { min: 3 })
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should handle empty validations', () => {
    const result = combineValidations();
    expect(result.isValid).toBe(true);
  });
});
