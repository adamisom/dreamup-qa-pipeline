// S3 client for screenshot and log storage
// Handles uploads, presigned URLs, and bucket management

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../utils/config.js';
import { withRetry } from '../utils/retry.js';
import { getErrorMessage } from '../utils/errors.js';

export class S3StorageClient {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const env = Config.getEnv();
    
    this.bucketName = env.s3BucketName;
    this.client = new S3Client({
      region: env.awsRegion,
      credentials: env.awsAccessKeyId && env.awsSecretAccessKey ? {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey
      } : undefined // Use default credential chain if not provided
    });
  }

  /**
   * Upload a screenshot buffer to S3
   * @param key - S3 object key (path)
   * @param buffer - Screenshot image buffer
   * @param contentType - MIME type (default: image/png)
   * @returns Promise<string> - S3 URL
   */
  async uploadScreenshot(key: string, buffer: Buffer, contentType = 'image/png'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Add metadata for organization
      Metadata: {
        uploadedAt: new Date().toISOString(),
        contentType: contentType
      }
    });

    try {
      // Use retry logic for uploads
      await withRetry(
        async () => {
          await this.client.send(command);
        },
        { maxRetries: 3, backoffMs: 1000 }
      );
      return this.getS3Url(key);
    } catch (error) {
      throw new Error(`Failed to upload screenshot: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Generate a presigned URL for viewing a screenshot (24 hour expiry)
   * @param key - S3 object key
   * @returns Promise<string> - Presigned URL
   */
  async generatePresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      return await getSignedUrl(this.client, command, { 
        expiresIn: 24 * 60 * 60 // 24 hours
      });
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Upload console logs as JSON
   * @param key - S3 object key
   * @param logs - Log data object
   * @returns Promise<string> - S3 URL
   */
  async uploadLogs(key: string, logs: any): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(logs, null, 2),
      ContentType: 'application/json',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        logType: 'console'
      }
    });

    try {
      // Use retry logic for uploads
      await withRetry(
        async () => {
          await this.client.send(command);
        },
        { maxRetries: 3, backoffMs: 1000 }
      );
      return this.getS3Url(key);
    } catch (error) {
      throw new Error(`Failed to upload logs: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Generate S3 URL (not presigned - for internal reference)
   * @param key - S3 object key
   * @returns string - S3 URL
   */
  private getS3Url(key: string): string {
    return `s3://${this.bucketName}/${key}`;
  }

  /**
   * Get the bucket name (for external access)
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Generate organized key path for screenshots
   * @param gameId - Game identifier (MD5 hash of URL)
   * @param timestamp - ISO timestamp
   * @param filename - Screenshot filename
   * @returns string - Organized S3 key
   */
  static generateScreenshotKey(gameId: string, timestamp: string, filename: string): string {
    return `${gameId}/${timestamp}/${filename}`;
  }
}


