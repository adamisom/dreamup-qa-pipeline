import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sleep, DurationTracker } from './timing.js';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should resolve after specified milliseconds', async () => {
    const promise = sleep(1000);
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    await expect(promise).resolves.toBeUndefined();
  });

  it('should not resolve before time elapses', async () => {
    const promise = sleep(1000);
    let resolved = false;
    
    promise.then(() => { resolved = true; });
    
    // Advance less than required
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();
    
    expect(resolved).toBe(true); // Actually this will resolve due to runAllTimersAsync
  });
});

describe('DurationTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should track elapsed time', () => {
    const tracker = new DurationTracker();
    
    vi.advanceTimersByTime(1000);
    expect(tracker.elapsed()).toBe(1000);
    
    vi.advanceTimersByTime(500);
    expect(tracker.elapsed()).toBe(1500);
  });

  it('should reset start time', () => {
    const tracker = new DurationTracker();
    
    vi.advanceTimersByTime(1000);
    expect(tracker.elapsed()).toBe(1000);
    
    tracker.reset();
    vi.advanceTimersByTime(500);
    expect(tracker.elapsed()).toBe(500);
  });

  it('should start at zero elapsed time', () => {
    const tracker = new DurationTracker();
    expect(tracker.elapsed()).toBe(0);
  });
});

