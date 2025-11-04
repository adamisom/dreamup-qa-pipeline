// Environment configuration utility
// Loads and validates environment variables with sensible defaults

import { QAConfig } from '../schemas/types';

export class Config {
  /**
   * Load configuration from environment variables
   * @returns QAConfig object with parsed values
   */
  static load(): QAConfig {
    return {
      maxTestDuration: parseInt(process.env.MAX_TEST_DURATION || '270000'), // 4.5 minutes
      screenshotDebounce: parseInt(process.env.SCREENSHOT_DEBOUNCE || '500'), // 500ms
      browserbaseTimeout: parseInt(process.env.BROWSERBASE_TIMEOUT || '60000'), // 60 seconds
    };
  }

  /**
   * Validate that all required environment variables are present
   * @throws Error if required variables are missing
   */
  static validate(): void {
    const required = [
      'BROWSERBASE_API_KEY',
      'BROWSERBASE_PROJECT_ID', 
      'ANTHROPIC_API_KEY',
      'AWS_REGION',
      'S3_BUCKET_NAME'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Get all environment variables in a structured format
   */
  static getEnv() {
    return {
      // Browserbase
      browserbaseApiKey: process.env.BROWSERBASE_API_KEY!,
      browserbaseProjectId: process.env.BROWSERBASE_PROJECT_ID!,
      
      // Anthropic
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      
      // AWS
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      
      // S3
      s3BucketName: process.env.S3_BUCKET_NAME!,
      
      // QA Config
      qaConfig: this.load()
    };
  }
}

