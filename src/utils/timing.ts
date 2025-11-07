// Timing utilities
// Provides sleep/delay functions and duration tracking

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Track duration of an operation
 */
export class DurationTracker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset the start time
   */
  reset(): void {
    this.startTime = Date.now();
  }
}

