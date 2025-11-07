// Error handling utilities
// Provides consistent error message extraction and error result creation

/**
 * Safely extract error message from unknown error type
 * @param error - Error object of unknown type
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Safely extract error stack from unknown error type
 * @param error - Error object of unknown type
 * @returns Error stack string or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

