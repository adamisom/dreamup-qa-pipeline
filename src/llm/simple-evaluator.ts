// Simple heuristic-based evaluator
// Provides basic pass/fail evaluation without LLM

import type { Screenshot, BasicQAResult } from '../schemas/types.js';

export class SimpleEvaluator {
  /**
   * Evaluate game quality based on screenshots and logs
   * @param screenshots - Array of captured screenshots
   * @param logs - Optional console logs
   * @param gameUrl - URL of the game being tested
   * @param duration - Test duration in milliseconds
   * @returns BasicQAResult with pass/fail status
   */
  evaluate(
    screenshots: Screenshot[],
    gameUrl: string,
    duration: number,
    logs?: string
  ): BasicQAResult {
    // Basic heuristics for evaluation

    // 1. Did we get any screenshots?
    if (screenshots.length === 0) {
      return {
        status: 'error',
        gameUrl,
        screenshots: [],
        duration,
        error: 'No screenshots captured',
      };
    }

    // 2. Check for error indicators in logs
    if (logs) {
      const errorPatterns = [
        /error/i,
        /failed/i,
        /exception/i,
        /cannot read property/i,
        /undefined is not a function/i,
        /network error/i,
        /404/i,
        /500/i,
      ];

      const hasErrors = errorPatterns.some(pattern => pattern.test(logs));
      if (hasErrors) {
        return {
          status: 'fail',
          gameUrl,
          screenshots,
          duration,
          error: 'Console errors detected',
        };
      }
    }

    // 3. Basic success criteria:
    // - At least one screenshot captured
    // - No obvious error messages in logs
    // - Screenshot URLs are valid (basic check)
    const hasValidScreenshots = screenshots.every(
      s => s.s3Url && s.s3Url.startsWith('http')
    );

    if (!hasValidScreenshots) {
      return {
        status: 'error',
        gameUrl,
        screenshots,
        duration,
        error: 'Invalid screenshot URLs',
      };
    }

    // 4. If we have screenshots and no obvious errors, consider it a pass
    // This is very basic - a real evaluator would analyze screenshot content
    return {
      status: 'pass',
      gameUrl,
      screenshots,
      duration,
    };
  }

  /**
   * Check if screenshot appears to be blank/error page
   * This is a placeholder - real implementation would analyze image content
   */
  private isBlankScreenshot(screenshot: Screenshot): boolean {
    // TODO: Implement image analysis to detect blank/error screens
    // For now, we assume all screenshots are valid
    return false;
  }
}

