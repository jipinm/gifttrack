/**
 * Validation Utilities
 * Common validation functions for form inputs
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate mobile number (10 digits, Indian format)
 * @param mobile - Mobile number to validate
 * @returns ValidationResult
 */
export function validateMobileNumber(mobile: string): ValidationResult {
  if (!mobile || mobile.trim() === '') {
    return { isValid: false, error: 'Mobile number is required' };
  }

  // Remove any spaces or dashes
  const cleanMobile = mobile.replace(/[\s-]/g, '');

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanMobile)) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits' };
  }

  // Check if it starts with a valid Indian mobile prefix (6-9)
  if (!/^[6-9]/.test(cleanMobile)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9' };
  }

  return { isValid: true };
}

/**
 * Validate password
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 6)
 * @param requireComplexity - Whether to require mixed characters (default: false)
 * @returns ValidationResult
 */
export function validatePassword(
  password: string,
  minLength: number = 6,
  requireComplexity: boolean = false
): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (requireComplexity) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase) {
      return {
        isValid: false,
        error: 'Password must contain both uppercase and lowercase letters',
      };
    }

    if (!hasNumber) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    if (!hasSpecial) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }
  }

  return { isValid: true };
}

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult
 */
export function validateRequired(
  value: string | number | null | undefined,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate date
 * @param date - Date to validate
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validateDate(
  date: Date | string | null | undefined,
  options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { required = true, minDate, maxDate, fieldName = 'Date' } = options;

  if (!date) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `${fieldName} is invalid` };
  }

  if (minDate && dateObj < minDate) {
    return {
      isValid: false,
      error: `${fieldName} must be on or after ${minDate.toLocaleDateString()}`,
    };
  }

  if (maxDate && dateObj > maxDate) {
    return {
      isValid: false,
      error: `${fieldName} must be on or before ${maxDate.toLocaleDateString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate positive number
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @param options - Validation options
 * @returns ValidationResult
 */
export function validatePositiveNumber(
  value: number | string | null | undefined,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult {
  const { required = true, min = 0, max, integer = false } = options;

  if (value === null || value === undefined || value === '') {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (numValue < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  if (integer && !Number.isInteger(numValue)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }

  return { isValid: true };
}

/**
 * Validate email address
 * @param email - Email to validate
 * @param required - Whether email is required
 * @returns ValidationResult
 */
export function validateEmail(email: string, required: boolean = false): ValidationResult {
  if (!email || email.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Email is required' };
    }
    return { isValid: true };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate text length
 * @param text - Text to validate
 * @param fieldName - Name of the field
 * @param options - Length options
 * @returns ValidationResult
 */
export function validateLength(
  text: string | null | undefined,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationResult {
  const { required = false, minLength, maxLength } = options;

  if (!text || text.trim() === '') {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const trimmedText = text.trim();

  if (minLength !== undefined && trimmedText.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (maxLength !== undefined && trimmedText.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validate name (letters, spaces, and common characters)
 * @param name - Name to validate
 * @param fieldName - Name of the field
 * @returns ValidationResult
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }

  // Allow letters, spaces, dots, and common name characters
  if (!/^[a-zA-Z\s.''-]+$/.test(name.trim())) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }

  return { isValid: true };
}

/**
 * Combine multiple validation results
 * @param results - Array of validation results
 * @returns Combined validation result
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}
