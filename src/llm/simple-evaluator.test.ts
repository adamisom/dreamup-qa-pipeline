import { describe, it, expect } from 'vitest';
import { SimpleEvaluator } from './simple-evaluator.js';
import type { Screenshot } from '../schemas/types.js';

describe('SimpleEvaluator', () => {
  const evaluator = new SimpleEvaluator();
  const gameUrl = 'https://example.com/game';
  
  const validScreenshot: Screenshot = {
    s3Url: 'https://example.com/screenshot.png',
    timestamp: '2024-01-01T00:00:00Z',
    trigger: 'load',
  };

  describe('evaluate', () => {
    it('should return error when no screenshots', () => {
      const result = evaluator.evaluate([], gameUrl, 1000);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('No screenshots captured');
      expect(result.screenshots).toEqual([]);
    });

    it('should return pass when screenshots are valid', () => {
      const result = evaluator.evaluate([validScreenshot], gameUrl, 1000);
      
      expect(result.status).toBe('pass');
      expect(result.error).toBeUndefined();
      expect(result.screenshots).toEqual([validScreenshot]);
    });

    it('should return fail when console errors detected', () => {
      const logs = 'Error: Something went wrong';
      const result = evaluator.evaluate([validScreenshot], gameUrl, 1000, logs);
      
      expect(result.status).toBe('fail');
      expect(result.error).toBe('Console errors detected');
    });

    it('should detect various error patterns', () => {
      const errorPatterns = [
        'Error: Failed to load',
        'Exception occurred',
        'Cannot read property',
        'undefined is not a function',
        'Network error',
        '404 Not Found',
        '500 Internal Server Error',
      ];

      for (const errorLog of errorPatterns) {
        const result = evaluator.evaluate([validScreenshot], gameUrl, 1000, errorLog);
        expect(result.status).toBe('fail');
        expect(result.error).toBe('Console errors detected');
      }
    });

    it('should return error when screenshot URLs are invalid', () => {
      const invalidScreenshot: Screenshot = {
        s3Url: 's3://bucket/key', // Not HTTP URL
        timestamp: '2024-01-01T00:00:00Z',
        trigger: 'load',
      };
      
      const result = evaluator.evaluate([invalidScreenshot], gameUrl, 1000);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('Invalid screenshot URLs');
    });

    it('should handle multiple screenshots', () => {
      const screenshots: Screenshot[] = [
        validScreenshot,
        {
          s3Url: 'https://example.com/s2.png',
          timestamp: '2024-01-01T00:01:00Z',
          trigger: 'interaction',
        },
      ];
      
      const result = evaluator.evaluate(screenshots, gameUrl, 2000);
      
      expect(result.status).toBe('pass');
      expect(result.screenshots).toEqual(screenshots);
    });

    it('should return error if any screenshot URL is invalid', () => {
      const screenshots: Screenshot[] = [
        validScreenshot,
        {
          s3Url: 'invalid-url', // Invalid
          timestamp: '2024-01-01T00:01:00Z',
          trigger: 'interaction',
        },
      ];
      
      const result = evaluator.evaluate(screenshots, gameUrl, 2000);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('Invalid screenshot URLs');
    });

    it('should include duration in result', () => {
      const result = evaluator.evaluate([validScreenshot], gameUrl, 5000);
      
      expect(result.duration).toBe(5000);
    });

    it('should not fail on case-insensitive error detection', () => {
      const logs = 'ERROR: Something failed';
      const result = evaluator.evaluate([validScreenshot], gameUrl, 1000, logs);
      
      expect(result.status).toBe('fail');
    });

    it('should pass when logs contain no errors', () => {
      const logs = 'Game loaded successfully';
      const result = evaluator.evaluate([validScreenshot], gameUrl, 1000, logs);
      
      expect(result.status).toBe('pass');
    });
  });
});

