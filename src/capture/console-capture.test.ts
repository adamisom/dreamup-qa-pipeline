import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleCapture, type ConsoleLog } from './console-capture.js';

describe('ConsoleCapture', () => {
  let mockStagehandClient: any;
  let mockS3Client: any;
  let mockPage: any;
  const gameUrl = 'https://example.com/game';

  beforeEach(() => {
    // Mock page with event emitters
    mockPage = {
      on: vi.fn(),
    };

    // Mock StagehandClient
    mockStagehandClient = {
      getPage: vi.fn().mockReturnValue(mockPage),
    };

    // Mock S3StorageClient
    mockS3Client = {
      uploadLogs: vi.fn().mockResolvedValue('s3://bucket/key'),
      generatePresignedUrl: vi.fn().mockResolvedValue('https://presigned-url.com/logs.json'),
    };
  });

  function createCaptureWithMockS3(): ConsoleCapture {
    const capture = new ConsoleCapture(mockStagehandClient, gameUrl);
    // Replace S3 client with mock
    (capture as any).s3Client = mockS3Client;
    return capture;
  }

  describe('constructor', () => {
    it('should initialize with game URL and generate game ID', () => {
      const capture = createCaptureWithMockS3();
      const gameId = (capture as any).gameId;
      
      expect(gameId).toBeDefined();
      expect(typeof gameId).toBe('string');
      expect(gameId.length).toBe(32); // MD5 hash length
      
      // Same URL should produce same game ID
      const capture2 = createCaptureWithMockS3();
      expect((capture2 as any).gameId).toBe(gameId);
    });
  });

  describe('getLogsAsString', () => {
    it('should return empty string when no logs', () => {
      const capture = createCaptureWithMockS3();
      expect(capture.getLogsAsString()).toBe('');
    });

    it('should format logs correctly', () => {
      const capture = createCaptureWithMockS3();
      
      // Manually add logs (simulating captured logs)
      (capture as any).logs = [
        {
          level: 'error' as const,
          message: 'Test error',
          timestamp: '2024-01-01T00:00:00Z',
          stack: 'file.js:10',
        },
        {
          level: 'warn' as const,
          message: 'Test warning',
          timestamp: '2024-01-01T00:01:00Z',
        },
      ];

      const result = capture.getLogsAsString();
      expect(result).toContain('[ERROR] Test error');
      expect(result).toContain('  at file.js:10');
      expect(result).toContain('[WARN] Test warning');
    });

    it('should include stack trace when available', () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        {
          level: 'error' as const,
          message: 'Error with stack',
          timestamp: '2024-01-01T00:00:00Z',
          stack: 'app.js:42',
        },
      ];

      const result = capture.getLogsAsString();
      expect(result).toContain('  at app.js:42');
    });

    it('should not include stack trace when not available', () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        {
          level: 'log' as const,
          message: 'Simple log',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      const result = capture.getLogsAsString();
      expect(result).toBe('[LOG] Simple log');
      expect(result).not.toContain('  at');
    });
  });

  describe('getErrorCount', () => {
    it('should return 0 when no logs', () => {
      const capture = createCaptureWithMockS3();
      expect(capture.getErrorCount()).toBe(0);
    });

    it('should count only error level logs', () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Error 1', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'warn', message: 'Warning', timestamp: '2024-01-01T00:01:00Z' },
        { level: 'error', message: 'Error 2', timestamp: '2024-01-01T00:02:00Z' },
        { level: 'log', message: 'Info', timestamp: '2024-01-01T00:03:00Z' },
      ];

      expect(capture.getErrorCount()).toBe(2);
    });

    it('should not count warnings as errors', () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'warn', message: 'Warning 1', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'warn', message: 'Warning 2', timestamp: '2024-01-01T00:01:00Z' },
      ];

      expect(capture.getErrorCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Error', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'warn', message: 'Warning', timestamp: '2024-01-01T00:01:00Z' },
      ];

      expect(capture.getErrorCount()).toBe(1);
      expect(capture.getLogsAsString()).not.toBe('');

      capture.clear();

      expect(capture.getErrorCount()).toBe(0);
      expect(capture.getLogsAsString()).toBe('');
    });
  });

  describe('filterRelevantLogs (via generateReport)', () => {
    it('should keep all errors regardless of content', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Favicon error', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'error', message: 'Extension error', timestamp: '2024-01-01T00:01:00Z' },
        { level: 'error', message: 'Google analytics error', timestamp: '2024-01-01T00:02:00Z' },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];
      expect(report.logs).toHaveLength(3); // All errors kept
      expect(report.errorCount).toBe(3);
    });

    it('should keep all warnings regardless of content', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'warn', message: 'Favicon warning', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'warn', message: 'Extension warning', timestamp: '2024-01-01T00:01:00Z' },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];
      expect(report.logs).toHaveLength(2); // All warnings kept
      expect(report.warningCount).toBe(2);
    });

    it('should filter out noise from info/log messages', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'log', message: 'Favicon not found', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'info', message: 'Extension background script', timestamp: '2024-01-01T00:01:00Z' },
        { level: 'log', message: 'Analytics initialized', timestamp: '2024-01-01T00:02:00Z' },
        { level: 'log', message: 'Game started successfully', timestamp: '2024-01-01T00:03:00Z' },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];
      // Only the game-related log should be kept (others match noise patterns)
      expect(report.logs).toHaveLength(1);
      expect(report.logs[0].message).toBe('Game started successfully');
    });

    it('should filter various noise patterns', async () => {
      const capture = createCaptureWithMockS3();
      const noiseMessages = [
        'Favicon.ico not found',
        'Extension background script loaded',
        'Chrome-extension://abc123',
        'Moz-extension://xyz789',
        'Analytics tracking enabled',
        'gtag() called',
        'ga(123)',
        'Google tag manager',
        'Facebook pixel',
        'fbq("track")',
      ];

      (capture as any).logs = noiseMessages.map(msg => ({
        level: 'log' as const,
        message: msg,
        timestamp: '2024-01-01T00:00:00Z',
      }));

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];
      expect(report.logs).toHaveLength(0); // All filtered out
    });

    it('should keep game-relevant info/log messages', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'log', message: 'Game engine initialized', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'info', message: 'Player score: 100', timestamp: '2024-01-01T00:01:00Z' },
        { level: 'log', message: 'Level completed', timestamp: '2024-01-01T00:02:00Z' },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];
      expect(report.logs).toHaveLength(3); // All kept
    });
  });

  describe('generateReport', () => {
    it('should return null when no logs captured', async () => {
      const capture = createCaptureWithMockS3();
      const result = await capture.generateReport();
      
      expect(result).toBeNull();
      expect(mockS3Client.uploadLogs).not.toHaveBeenCalled();
    });

    it('should generate report with correct structure', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Error 1', timestamp: '2024-01-01T00:00:00Z' },
        { level: 'warn', message: 'Warning 1', timestamp: '2024-01-01T00:01:00Z' },
        { level: 'warn', message: 'Warning 2', timestamp: '2024-01-01T00:02:00Z' },
        { level: 'log', message: 'Game log', timestamp: '2024-01-01T00:03:00Z' },
      ];

      const result = await capture.generateReport();

      expect(result).toBe('https://presigned-url.com/logs.json');
      expect(mockS3Client.uploadLogs).toHaveBeenCalledTimes(1);
      expect(mockS3Client.generatePresignedUrl).toHaveBeenCalledTimes(1);

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];

      expect(report.errorCount).toBe(1);
      expect(report.warningCount).toBe(2);
      expect(report.totalCount).toBe(4);
      expect(report.logs).toHaveLength(4);
      expect(report.filteredLogs).toContain('[ERROR] Error 1');
      expect(report.filteredLogs).toContain('[WARN] Warning 1');
      expect(report.filteredLogs).toContain('[LOG] Game log');
    });

    it('should generate correct S3 key format', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Test', timestamp: '2024-01-01T00:00:00Z' },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const key = uploadCall[0];
      
      // Should be: {gameId}/{timestamp}/console-logs.json
      expect(key).toMatch(/^[a-f0-9]{32}\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\/console-logs\.json$/);
    });

    it('should handle S3 upload errors', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        { level: 'error', message: 'Test', timestamp: '2024-01-01T00:00:00Z' },
      ];

      mockS3Client.uploadLogs.mockRejectedValue(new Error('S3 upload failed'));

      await expect(capture.generateReport()).rejects.toThrow('S3 upload failed');
    });

    it('should format filteredLogs string correctly', async () => {
      const capture = createCaptureWithMockS3();
      (capture as any).logs = [
        {
          level: 'error' as const,
          message: 'Test error',
          timestamp: '2024-01-01T00:00:00Z',
          stack: 'file.js:10',
        },
        {
          level: 'warn' as const,
          message: 'Test warning',
          timestamp: '2024-01-01T00:01:00Z',
        },
      ];

      await capture.generateReport();

      const uploadCall = mockS3Client.uploadLogs.mock.calls[0];
      const report = uploadCall[1];

      expect(report.filteredLogs).toContain('[ERROR] Test error');
      expect(report.filteredLogs).toContain('  at file.js:10');
      expect(report.filteredLogs).toContain('[WARN] Test warning');
      // Warning doesn't have stack, so "  at" should only appear once (for error)
      const atCount = (report.filteredLogs.match(/  at/g) || []).length;
      expect(atCount).toBe(1);
    });
  });

  describe('mapConsoleLevel (via startCapturing)', () => {
    it('should map console types correctly', async () => {
      const capture = createCaptureWithMockS3();
      
      const consoleHandler = vi.fn();
      mockPage.on.mockImplementation((event: string, handler: any) => {
        if (event === 'console') {
          consoleHandler.mockImplementation(handler);
        }
      });

      await capture.startCapturing();

      // Simulate different console message types
      const testCases = [
        { type: () => 'error', expected: 'error' },
        { type: () => 'ERROR', expected: 'error' },
        { type: () => 'warning', expected: 'warn' },
        { type: () => 'WARNING', expected: 'warn' },
        { type: () => 'info', expected: 'info' },
        { type: () => 'INFO', expected: 'info' },
        { type: () => 'debug', expected: 'debug' },
        { type: () => 'DEBUG', expected: 'debug' },
        { type: () => 'log', expected: 'log' },
        { type: () => 'LOG', expected: 'log' },
        { type: () => 'unknown', expected: 'log' }, // Default
      ];

      for (const testCase of testCases) {
        const mockMsg = {
          type: testCase.type,
          text: () => 'Test message',
          location: () => null,
        };

        consoleHandler(mockMsg);

        const logs = (capture as any).logs;
        const lastLog = logs[logs.length - 1];
        expect(lastLog.level).toBe(testCase.expected);
      }
    });
  });
});

