/**
 * Formatting Utilities Tests
 */
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMobileNumber,
  formatMobileForCall,
  truncateText,
  capitalizeWords,
  formatAbbreviatedNumber,
  formatPercentage,
  getInitials,
  formatFileSize,
} from '../../src/utils/format';

describe('formatCurrency', () => {
  it('should format number with rupee symbol', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
    expect(formatCurrency(100000)).toBe('₹1,00,000');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('should handle null/undefined', () => {
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });

  it('should handle string numbers', () => {
    expect(formatCurrency('5000')).toBe('₹5,000');
  });

  it('should respect decimals option', () => {
    expect(formatCurrency(1234.56, { decimals: 2 })).toBe('₹1,234.56');
  });

  it('should hide symbol when specified', () => {
    expect(formatCurrency(1000, { showSymbol: false })).toBe('1,000');
  });

  it('should use custom symbol', () => {
    expect(formatCurrency(1000, { symbol: '$' })).toBe('$1,000');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-03-15');

  it('should format date in short format', () => {
    const result = formatDate(testDate, 'short');
    expect(result).toMatch(/15\/03\/2024/);
  });

  it('should format date in medium format', () => {
    const result = formatDate(testDate, 'medium');
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });

  it('should format date in long format', () => {
    const result = formatDate(testDate, 'long');
    expect(result).toContain('March');
    expect(result).toContain('2024');
  });

  it('should format date in ISO format', () => {
    expect(formatDate(testDate, 'iso')).toBe('2024-03-15');
  });

  it('should handle string date input', () => {
    expect(formatDate('2024-03-15', 'iso')).toBe('2024-03-15');
  });

  it('should return dash for null/undefined', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  it('should return dash for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('should include time in output', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = formatDateTime(date);
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });

  it('should handle null/undefined', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime(undefined)).toBe('-');
  });
});

describe('formatMobileNumber', () => {
  it('should format 10-digit number with dashes', () => {
    expect(formatMobileNumber('9876543210')).toBe('987-654-3210');
  });

  it('should return original if not 10 digits', () => {
    expect(formatMobileNumber('12345')).toBe('12345');
  });

  it('should handle empty input', () => {
    expect(formatMobileNumber('')).toBe('-');
    expect(formatMobileNumber(null)).toBe('-');
  });
});

describe('formatMobileForCall', () => {
  it('should add +91 prefix for 10-digit number', () => {
    expect(formatMobileForCall('9876543210')).toBe('+919876543210');
  });

  it('should strip prefix and add +91', () => {
    expect(formatMobileForCall('+919876543210')).toBe('919876543210');
  });

  it('should handle empty input', () => {
    expect(formatMobileForCall('')).toBe('');
  });
});

describe('truncateText', () => {
  it('should truncate long text with ellipsis', () => {
    expect(truncateText('This is a long text', 10)).toBe('This is...');
  });

  it('should not truncate short text', () => {
    expect(truncateText('Short', 10)).toBe('Short');
  });

  it('should handle exact length', () => {
    expect(truncateText('Exact', 5)).toBe('Exact');
  });

  it('should handle empty input', () => {
    expect(truncateText('', 10)).toBe('');
    expect(truncateText(null, 10)).toBe('');
  });

  it('should use custom suffix', () => {
    expect(truncateText('Long text here', 8, '…')).toBe('Long te…');
  });
});

describe('capitalizeWords', () => {
  it('should capitalize first letter of each word', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('should handle single word', () => {
    expect(capitalizeWords('hello')).toBe('Hello');
  });

  it('should handle already capitalized text', () => {
    expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
  });

  it('should handle empty input', () => {
    expect(capitalizeWords('')).toBe('');
    expect(capitalizeWords(null)).toBe('');
  });
});

describe('formatAbbreviatedNumber', () => {
  it('should format thousands with K', () => {
    expect(formatAbbreviatedNumber(1500)).toBe('1.5K');
    expect(formatAbbreviatedNumber(10000)).toBe('10.0K');
  });

  it('should format lakhs with L', () => {
    expect(formatAbbreviatedNumber(150000)).toBe('1.5L');
    expect(formatAbbreviatedNumber(1000000)).toBe('10.0L');
  });

  it('should format crores with Cr', () => {
    expect(formatAbbreviatedNumber(15000000)).toBe('1.5Cr');
    expect(formatAbbreviatedNumber(100000000)).toBe('10.0Cr');
  });

  it('should not abbreviate small numbers', () => {
    expect(formatAbbreviatedNumber(999)).toBe('999');
  });

  it('should handle zero', () => {
    expect(formatAbbreviatedNumber(0)).toBe('0');
  });
});

describe('formatPercentage', () => {
  it('should format number as percentage', () => {
    expect(formatPercentage(0.5)).toBe('50%');
    expect(formatPercentage(1)).toBe('100%');
  });

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should respect decimal places', () => {
    expect(formatPercentage(0.3333, 2)).toBe('33.33%');
  });
});

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane Mary Smith')).toBe('JM');
  });

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should handle empty input', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials(null)).toBe('');
  });

  it('should limit to specified length', () => {
    expect(getInitials('John Doe Smith', 3)).toBe('JDS');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(2097152)).toBe('2.0 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(2147483648)).toBe('2.0 GB');
  });

  it('should handle zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});
