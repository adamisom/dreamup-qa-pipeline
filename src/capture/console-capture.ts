// Console log capture module
// Captures, filters, and uploads console logs to S3

import { StagehandClient } from '../browser/stagehand-client.js';
import { S3StorageClient } from '../storage/s3-client.js';
import { createHash } from 'node:crypto';
import { getErrorMessage } from '../utils/errors.js';

export interface ConsoleLog {
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  stack?: string;
}

export interface ConsoleReport {
  logs: ConsoleLog[];
  errorCount: number;
  warningCount: number;
  totalCount: number;
  filteredLogs: string; // Combined string for evaluator
}

export class ConsoleCapture {
  private logs: ConsoleLog[] = [];
  private stagehandClient: StagehandClient;
  private gameId: string;
  private s3Client: S3StorageClient;
  private capturing = false;

  constructor(stagehandClient: StagehandClient, gameUrl: string) {
    this.stagehandClient = stagehandClient;
    this.gameId = createHash('md5').update(gameUrl).digest('hex');
    this.s3Client = new S3StorageClient();
  }

  /**
   * Start capturing console events from the page
   */
  async startCapturing(): Promise<void> {
    if (this.capturing) {
      return;
    }

    try {
      const page = this.stagehandClient.getPage() as any; // Stagehand page type doesn't expose .on() in types
      
      // Listen to console events
      if (page.on) {
        page.on('console', (msg: any) => {
        try {
          const level = this.mapConsoleLevel(msg.type());
          const text = msg.text();
          const location = msg.location();
          
          this.logs.push({
            level,
            message: text,
            timestamp: new Date().toISOString(),
            stack: location?.url ? `${location.url}:${location.lineNumber || '?'}` : undefined,
          });
        } catch (err) {
          // Silently handle console capture errors to avoid breaking the test
          console.error(`Error capturing console message: ${getErrorMessage(err)}`);
        }
        });
      }

      // Also capture page errors
      if (page.on) {
        page.on('pageerror', (error: Error) => {
          this.logs.push({
            level: 'error',
            message: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack,
          });
        });
      }

      this.capturing = true;
    } catch (error) {
      console.error(`Failed to start console capture: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Map Playwright console type to our log level
   */
  private mapConsoleLevel(type: string): ConsoleLog['level'] {
    switch (type.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warn';
      case 'info':
        return 'info';
      case 'debug':
        return 'debug';
      default:
        return 'log';
    }
  }

  /**
   * Filter logs for game-relevant content
   * Removes noise like browser extensions, analytics, etc.
   */
  private filterRelevantLogs(logs: ConsoleLog[]): ConsoleLog[] {
    const noisePatterns = [
      /^favicon/i,
      /^extension/i,
      /^chrome-extension/i,
      /^moz-extension/i,
      /^analytics/i,
      /^gtag/i,
      /^ga\(/i,
      /^google/i,
      /^facebook/i,
      /^fbq\(/i,
    ];

    return logs.filter(log => {
      // Keep all errors and warnings
      if (log.level === 'error' || log.level === 'warn') {
        return true;
      }

      // Filter out noise from info/log messages
      return !noisePatterns.some(pattern => pattern.test(log.message));
    });
  }

  /**
   * Generate a report and upload to S3
   * @returns Presigned S3 URL for the log report
   */
  async generateReport(): Promise<string | null> {
    if (this.logs.length === 0) {
      return null;
    }

    try {
      // Filter for relevant logs
      const filteredLogs = this.filterRelevantLogs(this.logs);

      // Generate report
      const report: ConsoleReport = {
        logs: filteredLogs,
        errorCount: filteredLogs.filter(l => l.level === 'error').length,
        warningCount: filteredLogs.filter(l => l.level === 'warn').length,
        totalCount: filteredLogs.length,
        filteredLogs: filteredLogs.map(l => 
          `[${l.level.toUpperCase()}] ${l.message}${l.stack ? `\n  at ${l.stack}` : ''}`
        ).join('\n'),
      };

      // Generate S3 key
      const timestamp = new Date().toISOString();
      const key = `${this.gameId}/${timestamp}/console-logs.json`;

      // Upload to S3
      const s3Url = await this.s3Client.uploadLogs(key, report);

      // Generate presigned URL
      const presignedUrl = await this.s3Client.generatePresignedUrl(key);

      return presignedUrl;
    } catch (error) {
      console.error(`Failed to generate/upload console report: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Get all captured logs as a string (for evaluator)
   */
  getLogsAsString(): string {
    return this.logs
      .map(l => `[${l.level.toUpperCase()}] ${l.message}${l.stack ? `\n  at ${l.stack}` : ''}`)
      .join('\n');
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.logs.filter(l => l.level === 'error').length;
  }

  /**
   * Clear all captured logs
   */
  clear(): void {
    this.logs = [];
  }
}

