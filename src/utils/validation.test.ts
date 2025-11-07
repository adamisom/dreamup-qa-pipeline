import { describe, it, expect } from 'vitest';
import { isValidUrl, validateUrl } from './validation.js';

describe('isValidUrl', () => {
  it('should validate HTTP URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
    expect(isValidUrl('http://example.com:8080')).toBe(true);
  });

  it('should validate HTTPS URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('http://')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });

  it('should handle special characters', () => {
    expect(isValidUrl('https://example.com/path?q=test&x=1')).toBe(true);
    expect(isValidUrl('https://example.com/path#fragment')).toBe(true);
  });
});

describe('validateUrl', () => {
  it('should not throw for valid URLs', () => {
    expect(() => validateUrl('https://example.com')).not.toThrow();
    expect(() => validateUrl('http://example.com/path')).not.toThrow();
  });

  it('should throw for invalid URLs', () => {
    expect(() => validateUrl('not-a-url')).toThrow('Invalid URL format');
    expect(() => validateUrl('')).toThrow('Invalid URL format');
  });

  it('should include URL in error message', () => {
    try {
      validateUrl('bad-url');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Invalid URL format');
      expect((error as Error).message).toContain('bad-url');
    }
  });
});

