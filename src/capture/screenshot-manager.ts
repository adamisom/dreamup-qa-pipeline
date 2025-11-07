// Screenshot manager with debouncing and S3 upload
// Handles screenshot capture timing and immediate S3 storage

import { StagehandClient } from '../browser/stagehand-client.js';
import { S3StorageClient } from '../storage/s3-client.js';
import { Config } from '../utils/config.js';
import { getErrorMessage } from '../utils/errors.js';
import { generateGameId } from '../utils/game-id.js';
import type { Screenshot } from '../schemas/types.js';

export class ScreenshotManager {
  private lastScreenshotTime = 0;
  private s3Client: S3StorageClient;
  private stagehandClient: StagehandClient;
  private gameId: string;
  private config = Config.load();

  constructor(stagehandClient: StagehandClient, gameUrl: string) {
    this.stagehandClient = stagehandClient;
    this.s3Client = new S3StorageClient();
    this.gameId = generateGameId(gameUrl);
  }

  /**
   * Take a debounced screenshot and upload to S3
   * @param trigger - Description of what triggered this screenshot
   * @returns S3 URL or null if debounced
   */
  async takeDebouncedScreenshot(trigger: string): Promise<string | null> {
    const now = Date.now();
    const timeSinceLastScreenshot = now - this.lastScreenshotTime;

    // Check debounce timing
    if (timeSinceLastScreenshot < this.config.screenshotDebounce) {
      return null; // Debounced
    }

    try {
      // Get screenshot from Stagehand
      const screenshotBuffer = await this.stagehandClient.takeScreenshot();

      // Generate S3 key
      const timestamp = new Date().toISOString();
      const filename = `screenshot-${Date.now()}.png`;
      const s3Key = S3StorageClient.generateScreenshotKey(
        this.gameId,
        timestamp,
        filename
      );

      // Upload to S3 immediately
      const s3Url = await this.s3Client.uploadScreenshot(
        s3Key,
        screenshotBuffer
      );

      // Update last screenshot time
      this.lastScreenshotTime = now;

      return s3Url;
    } catch (error) {
      console.error(`Failed to take/upload screenshot: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Create a Screenshot object with presigned URL
   * @param trigger - Description of what triggered this screenshot
   * @returns Screenshot object or null if debounced
   */
  async captureScreenshot(trigger: string): Promise<Screenshot | null> {
    const s3Url = await this.takeDebouncedScreenshot(trigger);
    
    if (!s3Url) {
      return null; // Debounced
    }

    // Extract key from S3 URL (format: s3://bucket/key)
    const bucketName = this.s3Client.getBucketName();
    const key = s3Url.replace(`s3://${bucketName}/`, '');
    
    // Generate presigned URL for viewing
    const presignedUrl = await this.s3Client.generatePresignedUrl(key);

    return {
      s3Url: presignedUrl, // Use presigned URL for external access
      timestamp: new Date().toISOString(),
      trigger,
    };
  }

}

