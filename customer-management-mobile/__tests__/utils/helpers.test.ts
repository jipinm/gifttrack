/**
 * Helper Functions Tests
 */
import {
  debounce,
  throttle,
  isAdmin,
  isSuperAdmin,
  handleApiError,
  createQueryString,
  parseQueryString,
  deepClone,
  deepEqual,
  generateId,
  sleep,
  groupBy,
  sortBy,
  unique,
  isEmpty,
  pick,
  omit,
} from '../../src/utils/helpers';

// Mock timers for debounce/throttle tests
jest.useFakeTimers();

describe('debounce', () => {
  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should only call once for rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('arg1', 'arg2');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  it('should limit function calls', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow calls after delay', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn();
    jest.advanceTimersByTime(300);
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('isAdmin', () => {
  it('should return true for admin role', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true);
  });

  it('should return true for superadmin role', () => {
    expect(isAdmin({ role: 'superadmin' })).toBe(true);
  });

  it('should return false for other roles', () => {
    expect(isAdmin({ role: 'user' })).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('should return true for superadmin role', () => {
    expect(isSuperAdmin({ role: 'superadmin' })).toBe(true);
  });

  it('should return false for admin role', () => {
    expect(isSuperAdmin({ role: 'admin' })).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('handleApiError', () => {
  it('should extract message from axios error', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'API Error' },
      },
    };
    const result = handleApiError(error);
    expect(result.message).toBe('API Error');
  });

  it('should handle network error', () => {
    const error = new TypeError('Network request failed');
    const result = handleApiError(error);
    expect(result.message).toContain('Network');
  });

  it('should handle generic error', () => {
    const error = new Error('Something went wrong');
    const result = handleApiError(error);
    expect(result.message).toBe('Something went wrong');
  });
});

describe('createQueryString', () => {
  it('should create query string from object', () => {
    const params = { page: 1, search: 'test', perPage: 20 };
    const result = createQueryString(params);
    expect(result).toContain('page=1');
    expect(result).toContain('search=test');
    expect(result).toContain('perPage=20');
  });

  it('should skip null/undefined values', () => {
    const params = { page: 1, search: null, filter: undefined };
    const result = createQueryString(params);
    expect(result).toBe('?page=1');
  });

  it('should handle empty object', () => {
    expect(createQueryString({})).toBe('');
  });

  it('should encode special characters', () => {
    const params = { search: 'hello world' };
    const result = createQueryString(params);
    expect(result).toBe('?search=hello+world');
  });
});

describe('parseQueryString', () => {
  it('should parse query string to object', () => {
    const result = parseQueryString('page=1&search=test');
    expect(result).toEqual({ page: '1', search: 'test' });
  });

  it('should handle query string with leading ?', () => {
    const result = parseQueryString('?page=1&search=test');
    expect(result).toEqual({ page: '1', search: 'test' });
  });

  it('should handle empty string', () => {
    expect(parseQueryString('')).toEqual({});
  });

  it('should decode special characters', () => {
    const result = parseQueryString('search=hello%20world');
    expect(result.search).toBe('hello world');
  });
});

describe('deepClone', () => {
  it('should clone object deeply', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it('should clone arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
  });

  it('should handle primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('string')).toBe('string');
    expect(deepClone(null)).toBe(null);
  });
});

describe('deepEqual', () => {
  it('should return true for equal objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('should compare arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('should compare primitives', () => {
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(42, 43)).toBe(false);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('should generate non-empty IDs', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const promise = sleep(100);
    jest.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('groupBy', () => {
  it('should group items by key function', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];
    const result = groupBy(items, (item) => item.type);

    expect(result.a).toHaveLength(2);
    expect(result.b).toHaveLength(1);
  });

  it('should handle empty array', () => {
    expect(groupBy([], 'key')).toEqual({});
  });
});

describe('sortBy', () => {
  it('should sort by key function ascending', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const result = sortBy(items, (item) => item.value);
    expect(result.map((i) => i.value)).toEqual([1, 2, 3]);
  });

  it('should sort by key function descending', () => {
    const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
    const result = sortBy(items, (item) => item.value, 'desc');
    expect(result.map((i) => i.value)).toEqual([3, 2, 1]);
  });
});

describe('unique', () => {
  it('should remove duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('should work with strings', () => {
    expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('should handle empty array', () => {
    expect(unique([])).toEqual([]);
  });
});

describe('isEmpty', () => {
  it('should return true for empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty('text')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
  });
});

describe('pick', () => {
  it('should pick specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('should ignore missing keys', () => {
    const obj = { a: 1, b: 2 };
    expect(pick(obj, ['a', 'c' as keyof typeof obj])).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('should omit specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('should handle missing keys', () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj, ['c' as keyof typeof obj])).toEqual({ a: 1, b: 2 });
  });
});
