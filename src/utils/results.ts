// Result builder utilities
// Provides consistent error result creation

import type { BasicQAResult } from '../schemas/types.js';
import { getErrorMessage } from './errors.js';

/**
 * Create an error result
 */
export function createErrorResult(
  gameUrl: string,
  error: unknown,
  screenshots: BasicQAResult['screenshots'] = [],
  duration: number = 0
): BasicQAResult {
  return {
    status: 'error',
    gameUrl,
    screenshots,
    duration,
    error: getErrorMessage(error),
  };
}

/**
 * Create a fail result
 */
export function createFailResult(
  gameUrl: string,
  error: string,
  screenshots: BasicQAResult['screenshots'] = [],
  duration: number = 0
): BasicQAResult {
  return {
    status: 'fail',
    gameUrl,
    screenshots,
    duration,
    error,
  };
}

