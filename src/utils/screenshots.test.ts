import { describe, it, expect, beforeEach } from 'vitest';
import { ScreenshotCollection } from './screenshots.js';
import type { Screenshot } from '../schemas/types.js';

describe('ScreenshotCollection', () => {
  let collection: ScreenshotCollection;
  const mockScreenshot: Screenshot = {
    s3Url: 'http://example.com/screenshot.png',
    timestamp: '2024-01-01T00:00:00Z',
    trigger: 'test',
  };

  beforeEach(() => {
    collection = new ScreenshotCollection();
  });

  it('should start empty', () => {
    expect(collection.count()).toBe(0);
    expect(collection.getAll()).toEqual([]);
  });

  it('should add screenshot', () => {
    collection.add(mockScreenshot);
    
    expect(collection.count()).toBe(1);
    expect(collection.getAll()).toEqual([mockScreenshot]);
  });

  it('should ignore null screenshots', () => {
    collection.add(null);
    
    expect(collection.count()).toBe(0);
    expect(collection.getAll()).toEqual([]);
  });

  it('should add multiple screenshots', () => {
    const screenshot2: Screenshot = {
      s3Url: 'http://example.com/s2.png',
      timestamp: '2024-01-01T00:01:00Z',
      trigger: 'test2',
    };
    
    collection.add(mockScreenshot);
    collection.add(screenshot2);
    
    expect(collection.count()).toBe(2);
    expect(collection.getAll()).toEqual([mockScreenshot, screenshot2]);
  });

  it('should add all screenshots', () => {
    const screenshot2: Screenshot = {
      s3Url: 'http://example.com/s2.png',
      timestamp: '2024-01-01T00:01:00Z',
      trigger: 'test2',
    };
    
    collection.addAll([mockScreenshot, screenshot2, null, undefined]);
    
    expect(collection.count()).toBe(2);
    expect(collection.getAll()).toEqual([mockScreenshot, screenshot2]);
  });

  it('should clear all screenshots', () => {
    collection.add(mockScreenshot);
    expect(collection.count()).toBe(1);
    
    collection.clear();
    
    expect(collection.count()).toBe(0);
    expect(collection.getAll()).toEqual([]);
  });

  it('should return a copy of screenshots', () => {
    collection.add(mockScreenshot);
    const all = collection.getAll();
    
    // Modifying the returned array should not affect the collection
    all.push(mockScreenshot);
    
    expect(collection.count()).toBe(1);
  });
});

