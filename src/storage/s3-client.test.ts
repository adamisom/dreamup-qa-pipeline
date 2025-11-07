import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3StorageClient } from './s3-client.js';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: class {
      input: any;
      constructor(input: any) {
        this.input = input;
      }
    },
    GetObjectCommand: class {
      input: any;
      constructor(input: any) {
        this.input = input;
      }
    },
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.com/test'),
}));

vi.mock('../utils/config.js', () => ({
  Config: {
    getEnv: () => ({
      s3BucketName: 'test-bucket',
      awsRegion: 'us-east-1',
      awsAccessKeyId: 'test-key',
      awsSecretAccessKey: 'test-secret',
    }),
  },
}));

vi.mock('../utils/retry.js', () => ({
  withRetry: vi.fn((fn) => fn()),
}));

describe('S3StorageClient', () => {
  const mockBucketName = 'test-bucket';

  describe('constructor and getBucketName', () => {
    it('should initialize with bucket name from config', () => {
      const client = new S3StorageClient();
      expect(client.getBucketName()).toBe(mockBucketName);
    });
  });

  describe('generateScreenshotKey', () => {
    it('should generate correct key format', () => {
      const gameId = 'abc123def456';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const filename = 'screenshot.png';

      const key = S3StorageClient.generateScreenshotKey(gameId, timestamp, filename);

      expect(key).toBe(`${gameId}/${timestamp}/${filename}`);
    });

    it('should handle different file extensions', () => {
      const key = S3StorageClient.generateScreenshotKey('game1', '2024-01-01T00:00:00.000Z', 'test.jpg');
      expect(key).toContain('.jpg');
    });

    it('should preserve path structure', () => {
      const key = S3StorageClient.generateScreenshotKey('game1', '2024-01-01T00:00:00.000Z', 'screenshot.png');
      expect(key).toMatch(/^game1\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\/screenshot\.png$/);
    });
  });

  // Note: uploadScreenshot and uploadLogs tests require more complex mocking
  // of the AWS SDK and retry logic. These are better suited for integration tests.
  // The key generation and bucket name getter are pure functions that are easily testable.
});
