// Retry logic utilities
// Provides exponential backoff retry functionality

import { sleep } from './timing.js';
import { getErrorMessage } from './errors.js';

export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  exponentialBase?: number;
}

/**
 * Retry an operation with exponential backoff
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the operation
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    exponentialBase = 2,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(exponentialBase, attempt);
        await sleep(delay);
      }
    }
  }

  // All retries failed, throw the last error
  throw new Error(
    `Operation failed after ${maxRetries + 1} attempts: ${getErrorMessage(lastError!)}`
  );
}

