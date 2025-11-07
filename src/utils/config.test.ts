import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Config } from './config.js';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('load', () => {
    it('should load defaults when env vars not set', () => {
      delete process.env.MAX_TEST_DURATION;
      delete process.env.SCREENSHOT_DEBOUNCE;
      delete process.env.BROWSERBASE_TIMEOUT;
      
      const config = Config.load();
      
      expect(config.maxTestDuration).toBe(270000);
      expect(config.screenshotDebounce).toBe(500);
      expect(config.browserbaseTimeout).toBe(60000);
    });

    it('should load from environment variables', () => {
      process.env.MAX_TEST_DURATION = '300000';
      process.env.SCREENSHOT_DEBOUNCE = '1000';
      process.env.BROWSERBASE_TIMEOUT = '120000';
      
      const config = Config.load();
      
      expect(config.maxTestDuration).toBe(300000);
      expect(config.screenshotDebounce).toBe(1000);
      expect(config.browserbaseTimeout).toBe(120000);
    });

    it('should parse string values to integers', () => {
      process.env.MAX_TEST_DURATION = '123';
      const config = Config.load();
      
      expect(config.maxTestDuration).toBe(123);
      expect(typeof config.maxTestDuration).toBe('number');
    });
  });

  describe('validate', () => {
    it('should pass when all required vars are set', () => {
      process.env.BROWSERBASE_API_KEY = 'test-key';
      process.env.BROWSERBASE_PROJECT_ID = 'test-project';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic';
      process.env.AWS_REGION = 'us-east-1';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      
      expect(() => Config.validate()).not.toThrow();
    });

    it('should throw when required vars are missing', () => {
      delete process.env.BROWSERBASE_API_KEY;
      
      expect(() => Config.validate()).toThrow('Missing required environment variables');
    });

    it('should list all missing variables', () => {
      delete process.env.BROWSERBASE_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      try {
        Config.validate();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('BROWSERBASE_API_KEY');
        expect((error as Error).message).toContain('ANTHROPIC_API_KEY');
      }
    });
  });

  describe('getEnv', () => {
    it('should return structured env object', () => {
      process.env.BROWSERBASE_API_KEY = 'bb-key';
      process.env.BROWSERBASE_PROJECT_ID = 'bb-project';
      process.env.ANTHROPIC_API_KEY = 'anth-key';
      process.env.AWS_REGION = 'us-west-2';
      process.env.S3_BUCKET_NAME = 'my-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';
      
      const env = Config.getEnv();
      
      expect(env.browserbaseApiKey).toBe('bb-key');
      expect(env.browserbaseProjectId).toBe('bb-project');
      expect(env.anthropicApiKey).toBe('anth-key');
      expect(env.awsRegion).toBe('us-west-2');
      expect(env.s3BucketName).toBe('my-bucket');
      expect(env.awsAccessKeyId).toBe('access-key');
      expect(env.awsSecretAccessKey).toBe('secret-key');
      expect(env.qaConfig).toBeDefined();
    });

    it('should use default region when not set', () => {
      delete process.env.AWS_REGION;
      process.env.BROWSERBASE_API_KEY = 'key';
      process.env.BROWSERBASE_PROJECT_ID = 'project';
      process.env.ANTHROPIC_API_KEY = 'anth-key';
      process.env.S3_BUCKET_NAME = 'bucket';
      
      const env = Config.getEnv();
      
      expect(env.awsRegion).toBe('us-east-1');
    });

    it('should handle optional AWS credentials', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.BROWSERBASE_API_KEY = 'key';
      process.env.BROWSERBASE_PROJECT_ID = 'project';
      process.env.ANTHROPIC_API_KEY = 'anth-key';
      process.env.S3_BUCKET_NAME = 'bucket';
      
      const env = Config.getEnv();
      
      expect(env.awsAccessKeyId).toBeUndefined();
      expect(env.awsSecretAccessKey).toBeUndefined();
    });
  });
});

