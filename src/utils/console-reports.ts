// Console report utilities
// Helper functions for generating console log reports

import type { ConsoleLog } from '../capture/console-capture.js';

/**
 * Safely generate console log report with error handling
 * @param consoleCapture - ConsoleCapture instance
 * @returns Promise<string | undefined> - Presigned URL or undefined if failed
 */
export async function generateConsoleReportSafely(
  consoleCapture: { generateReport: () => Promise<string | null> }
): Promise<string | undefined> {
  try {
    const logsUrl = await consoleCapture.generateReport();
    return logsUrl || undefined;
  } catch (error) {
    // Silently fail - console logs are supplementary evidence
    console.error(`Failed to generate console log report: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

