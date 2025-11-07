import { describe, it, expect, vi } from 'vitest';
import { generateConsoleReportSafely } from './console-reports.js';

describe('generateConsoleReportSafely', () => {
  it('should return presigned URL when report generation succeeds', async () => {
    const mockConsoleCapture = {
      generateReport: vi.fn().mockResolvedValue('https://presigned-url.com/logs.json'),
    };

    const result = await generateConsoleReportSafely(mockConsoleCapture);

    expect(result).toBe('https://presigned-url.com/logs.json');
    expect(mockConsoleCapture.generateReport).toHaveBeenCalledTimes(1);
  });

  it('should return undefined when report generation returns null', async () => {
    const mockConsoleCapture = {
      generateReport: vi.fn().mockResolvedValue(null),
    };

    const result = await generateConsoleReportSafely(mockConsoleCapture);

    expect(result).toBeUndefined();
  });

  it('should return undefined and log error when report generation throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('S3 upload failed');
    const mockConsoleCapture = {
      generateReport: vi.fn().mockRejectedValue(error),
    };

    const result = await generateConsoleReportSafely(mockConsoleCapture);

    expect(result).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate console log report: S3 upload failed'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle non-Error exceptions', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockConsoleCapture = {
      generateReport: vi.fn().mockRejectedValue('String error'),
    };

    const result = await generateConsoleReportSafely(mockConsoleCapture);

    expect(result).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate console log report: String error'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle undefined/null errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockConsoleCapture = {
      generateReport: vi.fn().mockRejectedValue(null),
    };

    const result = await generateConsoleReportSafely(mockConsoleCapture);

    expect(result).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate console log report: null'
    );
    
    consoleErrorSpy.mockRestore();
  });
});

