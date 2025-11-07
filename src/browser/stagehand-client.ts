// Stagehand browser automation client
// Handles browser initialization, navigation, and screenshot capture

import { Stagehand } from "@browserbasehq/stagehand";
import { Config } from '../utils/config.js';
import { sleep } from '../utils/timing.js';
import { getErrorMessage } from '../utils/errors.js';
import type { V3Context } from "@browserbasehq/stagehand";

export class StagehandClient {
  private stagehand: Stagehand | null = null;
  private initialized = false;

  /**
   * Initialize Stagehand with Browserbase configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const env = Config.getEnv();
    
    this.stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: env.browserbaseApiKey,
      projectId: env.browserbaseProjectId,
      model: "anthropic/claude-3-5-sonnet-20241022",
      modelApiKey: env.anthropicApiKey,
      verbose: 1,
    });

    await this.stagehand.init();
    this.initialized = true;
  }

  /**
   * Get the Stagehand instance (throws if not initialized)
   */
  getStagehand(): Stagehand {
    if (!this.stagehand || !this.initialized) {
      throw new Error("Stagehand not initialized. Call initialize() first.");
    }
    return this.stagehand;
  }

  /**
   * Get the browser context
   */
  getContext(): V3Context {
    return this.getStagehand().context;
  }

  /**
   * Get the active page
   */
  getPage() {
    const pages = this.getContext().pages();
    if (pages.length === 0) {
      throw new Error("No pages available");
    }
    return pages[0];
  }

  /**
   * Navigate to a game URL and wait for load
   */
  async navigateToGame(url: string): Promise<void> {
    const page = this.getPage();
    const config = Config.load();
    
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.browserbaseTimeout,
      });
      
      // Wait a bit for any dynamic content
      await sleep(2000);
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Take a screenshot and return as Buffer
   */
  async takeScreenshot(): Promise<Buffer> {
    const page = this.getPage();
    
    try {
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });
      
      return Buffer.from(screenshot);
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Close the browser session and cleanup
   */
  async close(): Promise<void> {
    if (this.stagehand && this.initialized) {
      try {
        await this.stagehand.close();
      } catch (error) {
        console.error("Error closing Stagehand:", error);
      }
      this.stagehand = null;
      this.initialized = false;
    }
  }

  /**
   * Get the Browserbase session ID
   */
  getSessionId(): string | undefined {
    return this.stagehand?.browserbaseSessionId;
  }

  /**
   * Get the Browserbase session URL
   */
  getSessionUrl(): string | undefined {
    const sessionId = this.getSessionId();
    return sessionId ? `https://browserbase.com/sessions/${sessionId}` : undefined;
  }
}

