/**
 * Formatting Utilities
 * Functions for formatting values for display
 */

/**
 * Format currency value (Indian Rupees)
 * @param value - Numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: {
    symbol?: string;
    decimals?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const { symbol = '₹', decimals = 0, showSymbol = true } = options;

  if (value === null || value === undefined || value === '') {
    return showSymbol ? `${symbol}0` : '0';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return showSymbol ? `${symbol}0` : '0';
  }

  // Format with Indian number system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(numValue);
  return showSymbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Format date for display
 * @param date - Date to format
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'medium' | 'long' | 'relative' | 'iso' = 'medium'
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (format) {
    case 'short':
      // DD/MM/YYYY
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    case 'medium':
      // DD MMM YYYY
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    case 'long':
      // DD Month YYYY
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    case 'relative':
      return formatRelativeDate(dateObj);

    case 'iso':
      return dateObj.toISOString().split('T')[0];

    default:
      return dateObj.toLocaleDateString('en-IN');
  }
}

/**
 * Format date relative to now
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    return formatDate(date, 'medium');
  }
}

/**
 * Format date and time
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format mobile number for display
 * @param mobile - Mobile number to format
 * @returns Formatted mobile number
 */
export function formatMobileNumber(mobile: string | null | undefined): string {
  if (!mobile) {
    return '-';
  }

  // Remove any non-digit characters
  const digits = mobile.replace(/\D/g, '');

  if (digits.length === 10) {
    // Format as XXX-XXX-XXXX
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    // Indian number with country code
    return `+91 ${digits.slice(2, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }

  return mobile;
}

/**
 * Format mobile number for calling (with tel: protocol)
 * @param mobile - Mobile number
 * @returns Mobile number formatted for tel: link
 */
export function formatMobileForCall(mobile: string | null | undefined): string {
  if (!mobile) {
    return '';
  }

  const digits = mobile.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits;
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated
 * @returns Truncated text
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format number with abbreviation (K, L, Cr)
 * @param value - Number to format
 * @returns Abbreviated number string
 */
export function formatAbbreviatedNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 10000000) {
    // Crores (10 million+)
    return `${sign}${(absValue / 10000000).toFixed(1)}Cr`;
  } else if (absValue >= 100000) {
    // Lakhs (100 thousand+)
    return `${sign}${(absValue / 100000).toFixed(1)}L`;
  } else if (absValue >= 1000) {
    // Thousands
    return `${sign}${(absValue / 1000).toFixed(1)}K`;
  }

  return `${sign}${absValue}`;
}

/**
 * Format percentage
 * @param value - Decimal value (0.25 = 25%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get initials from name
 * @param name - Full name
 * @param maxLength - Maximum number of initials
 * @returns Initials
 */
export function getInitials(name: string | null | undefined, maxLength: number = 2): string {
  if (!name) {
    return '';
  }

  return name
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .slice(0, maxLength)
    .join('');
}

/**
 * Format file size
 * @param bytes - Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
