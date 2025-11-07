// Screenshot collection utilities
// Provides helpers for managing screenshot arrays

import type { Screenshot } from '../schemas/types.js';

/**
 * Screenshot collection helper
 * Manages an array of screenshots with convenient methods
 */
export class ScreenshotCollection {
  private screenshots: Screenshot[] = [];

  /**
   * Add a screenshot to the collection (if not null)
   * @param screenshot - Screenshot to add, or null if debounced
   */
  add(screenshot: Screenshot | null): void {
    if (screenshot) {
      this.screenshots.push(screenshot);
    }
  }

  /**
   * Add multiple screenshots
   * @param screenshots - Array of screenshots to add
   */
  addAll(screenshots: (Screenshot | null | undefined)[]): void {
    for (const screenshot of screenshots) {
      if (screenshot) {
        this.screenshots.push(screenshot);
      }
    }
  }

  /**
   * Get all screenshots
   */
  getAll(): Screenshot[] {
    return [...this.screenshots];
  }

  /**
   * Get the number of screenshots
   */
  count(): number {
    return this.screenshots.length;
  }

  /**
   * Clear all screenshots
   */
  clear(): void {
    this.screenshots = [];
  }
}

