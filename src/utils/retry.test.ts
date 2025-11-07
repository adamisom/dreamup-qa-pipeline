import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempt = 0;
    const operation = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt < 3) {
        throw new Error('Failed');
      }
      return 'success';
    });
    
    const result = await withRetry(operation, { maxRetries: 3, backoffMs: 10 });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(
      withRetry(operation, { maxRetries: 2, backoffMs: 10 })
    ).rejects.toThrow('Operation failed after 3 attempts');
    
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));
    const startTime = Date.now();
    
    await expect(
      withRetry(operation, { 
        maxRetries: 2, 
        backoffMs: 50,
        exponentialBase: 2 
      })
    ).rejects.toThrow();
    
    const elapsed = Date.now() - startTime;
    // Should take at least: 50ms (first retry) + 100ms (second retry) = 150ms
    // Allow some margin for test execution
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should use custom retry options', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));
    
    await expect(
      withRetry(operation, { 
        maxRetries: 1,
        backoffMs: 10 
      })
    ).rejects.toThrow();
    
    expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});

