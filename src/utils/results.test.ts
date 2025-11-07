import { describe, it, expect } from 'vitest';
import { createErrorResult, createFailResult } from './results.js';
import type { BasicQAResult } from '../schemas/types.js';

describe('createErrorResult', () => {
  it('should create error result with Error instance', () => {
    const error = new Error('Test error');
    const result = createErrorResult('https://example.com', error);
    
    expect(result).toEqual({
      status: 'error',
      gameUrl: 'https://example.com',
      screenshots: [],
      duration: 0,
      error: 'Test error',
    });
  });

  it('should create error result with string error', () => {
    const result = createErrorResult('https://example.com', 'String error');
    
    expect(result.status).toBe('error');
    expect(result.error).toBe('String error');
  });

  it('should include screenshots if provided', () => {
    const screenshots: BasicQAResult['screenshots'] = [
      { s3Url: 'http://example.com/s1.png', timestamp: '2024-01-01', trigger: 'load' },
    ];
    const result = createErrorResult('https://example.com', 'Error', screenshots, 1000);
    
    expect(result.screenshots).toEqual(screenshots);
    expect(result.duration).toBe(1000);
  });

  it('should use default values', () => {
    const result = createErrorResult('https://example.com', 'Error');
    
    expect(result.screenshots).toEqual([]);
    expect(result.duration).toBe(0);
  });
});

describe('createFailResult', () => {
  it('should create fail result', () => {
    const result = createFailResult('https://example.com', 'Game failed to load');
    
    expect(result).toEqual({
      status: 'fail',
      gameUrl: 'https://example.com',
      screenshots: [],
      duration: 0,
      error: 'Game failed to load',
    });
  });

  it('should include screenshots and duration', () => {
    const screenshots: BasicQAResult['screenshots'] = [
      { s3Url: 'http://example.com/s1.png', timestamp: '2024-01-01', trigger: 'load' },
    ];
    const result = createFailResult('https://example.com', 'Failed', screenshots, 2000);
    
    expect(result.status).toBe('fail');
    expect(result.screenshots).toEqual(screenshots);
    expect(result.duration).toBe(2000);
    expect(result.error).toBe('Failed');
  });
});

