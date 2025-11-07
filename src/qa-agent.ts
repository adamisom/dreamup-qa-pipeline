// Main QA Agent orchestrator
// Coordinates game loading, screenshot capture, and evaluation

import "dotenv/config";
import { StagehandClient } from './browser/stagehand-client.js';
import { ScreenshotManager } from './capture/screenshot-manager.js';
import { GameLoader } from './browser/game-loader.js';
import { SimpleEvaluator } from './llm/simple-evaluator.js';
import { Config } from './utils/config.js';
import { isValidUrl } from './utils/validation.js';
import { createErrorResult, createFailResult } from './utils/results.js';
import { sleep, DurationTracker } from './utils/timing.js';
import { getErrorMessage } from './utils/errors.js';
import { ScreenshotCollection } from './utils/screenshots.js';
import type { BasicQAResult } from './schemas/types.js';

/**
 * Run a QA test on a game URL
 * @param gameUrl - URL of the game to test
 * @returns BasicQAResult with test results
 */
export async function runQATest(gameUrl: string): Promise<BasicQAResult> {
  const duration = new DurationTracker();
  
  // Validate URL format
  if (!isValidUrl(gameUrl)) {
    return createErrorResult(gameUrl, 'Invalid URL format');
  }

  // Validate environment
  try {
    Config.validate();
  } catch (error) {
    return createErrorResult(gameUrl, error);
  }

  const stagehandClient = new StagehandClient();
  const screenshots = new ScreenshotCollection();

  try {
    console.log(`🎮 Starting QA test for: ${gameUrl}`);
    
    // Initialize browser
    console.log('📱 Initializing browser...');
    await stagehandClient.initialize();
    const sessionUrl = stagehandClient.getSessionUrl();
    if (sessionUrl) {
      console.log(`   🔗 Watch live: ${sessionUrl}`);
    }

    // Create screenshot manager
    const screenshotManager = new ScreenshotManager(stagehandClient, gameUrl);

    // Create game loader
    const gameLoader = new GameLoader(stagehandClient, screenshotManager);

    // Load the game
    console.log('🌐 Loading game...');
    const loadResult = await gameLoader.loadGame(gameUrl);

    screenshots.add(loadResult.screenshot);

    if (!loadResult.success) {
      console.log(`❌ Game load failed: ${loadResult.error}`);
      return createFailResult(
        gameUrl,
        loadResult.error || 'Game load failed',
        screenshots.getAll(),
        duration.elapsed()
      );
    }

    console.log(`✅ Game loaded successfully (${loadResult.loadTime}ms)`);

    // Wait a bit and take another screenshot to see if game is interactive
    console.log('📸 Capturing additional screenshots...');
    await sleep(2000);
    
    const additionalScreenshot = await screenshotManager.captureScreenshot('post_load');
    screenshots.add(additionalScreenshot);

    // Evaluate results
    console.log('🔍 Evaluating results...');
    const evaluator = new SimpleEvaluator();
    const result = evaluator.evaluate(
      screenshots.getAll(),
      gameUrl,
      duration.elapsed()
    );

    console.log(`✅ Test complete: ${result.status.toUpperCase()}`);
    return result;

  } catch (error) {
    console.error('❌ QA test failed:', error);
    return createErrorResult(gameUrl, error, screenshots.getAll(), duration.elapsed());
  } finally {
    // Always cleanup browser session
    try {
      await stagehandClient.close();
      console.log('🧹 Browser session closed');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}

// CLI handling - run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('qa-agent')) {
  const gameUrl = process.argv[2];
  
  if (!gameUrl) {
    console.error('Usage: npm run qa <game-url>');
    console.error('Example: npm run qa https://example.com');
    process.exit(1);
  }

  runQATest(gameUrl)
    .then(result => {
      console.log('\n📊 QA Test Results:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.status === 'pass' ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

