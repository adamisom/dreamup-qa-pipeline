import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorStack } from './errors.js';

describe('getErrorMessage', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should convert number to string', () => {
    expect(getErrorMessage(123)).toBe('123');
  });

  it('should convert object to string', () => {
    expect(getErrorMessage({ key: 'value' })).toBe('[object Object]');
  });

  it('should handle null', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('should handle undefined', () => {
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it('should handle boolean', () => {
    expect(getErrorMessage(true)).toBe('true');
    expect(getErrorMessage(false)).toBe('false');
  });
});

describe('getErrorStack', () => {
  it('should extract stack from Error instance', () => {
    const error = new Error('Test error');
    const stack = getErrorStack(error);
    expect(stack).toBeDefined();
    expect(typeof stack).toBe('string');
    expect(stack).toContain('Error: Test error');
  });

  it('should return undefined for string', () => {
    expect(getErrorStack('String error')).toBeUndefined();
  });

  it('should return undefined for non-Error objects', () => {
    expect(getErrorStack({ key: 'value' })).toBeUndefined();
    expect(getErrorStack(null)).toBeUndefined();
    expect(getErrorStack(undefined)).toBeUndefined();
  });
});

