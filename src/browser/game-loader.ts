// Game loader - handles navigation and initial state capture
// Detects load success/failure and captures initial screenshot

import { StagehandClient } from './stagehand-client.js';
import { ScreenshotManager } from '../capture/screenshot-manager.js';
import { sleep, DurationTracker } from '../utils/timing.js';
import { getErrorMessage } from '../utils/errors.js';
import type { LoadResult, Screenshot } from '../schemas/types.js';
import { Config } from '../utils/config.js';

export class GameLoader {
  private stagehandClient: StagehandClient;
  private screenshotManager: ScreenshotManager;
  private config = Config.load();

  constructor(stagehandClient: StagehandClient, screenshotManager: ScreenshotManager) {
    this.stagehandClient = stagehandClient;
    this.screenshotManager = screenshotManager;
  }

  /**
   * Load a game URL and capture initial state
   * @param gameUrl - URL of the game to load
   * @returns LoadResult with success status and initial screenshot
   */
  async loadGame(gameUrl: string): Promise<LoadResult> {
    const duration = new DurationTracker();

    try {
      // Navigate to the game URL
      await this.stagehandClient.navigateToGame(gameUrl);

      // Wait a bit for any dynamic content to load
      await sleep(2000);

      // Take initial screenshot
      const screenshot = await this.screenshotManager.captureScreenshot('initial_load');

      const loadTime = duration.elapsed();

      // Basic success detection: if we got here and have a screenshot, it's likely successful
      // More sophisticated detection could analyze the screenshot content
      return {
        success: true,
        screenshot: screenshot || undefined,
        loadTime,
      };
    } catch (error) {
      const loadTime = duration.elapsed();
      
      // Try to capture error screenshot
      let errorScreenshot: Screenshot | undefined;
      try {
        errorScreenshot = await this.screenshotManager.captureScreenshot('load_error') || undefined;
      } catch (screenshotError) {
        // Ignore screenshot errors if we're already in error state
      }

      return {
        success: false,
        screenshot: errorScreenshot,
        error: getErrorMessage(error),
        loadTime,
      };
    }
  }

  /**
   * Wait for a specific condition or timeout
   * @param condition - Function that returns true when condition is met
   * @param timeoutMs - Maximum time to wait
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = 10000
  ): Promise<boolean> {
    const duration = new DurationTracker();
    const checkInterval = 500; // Check every 500ms

    while (duration.elapsed() < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await sleep(checkInterval);
    }

    return false; // Timeout
  }
}

