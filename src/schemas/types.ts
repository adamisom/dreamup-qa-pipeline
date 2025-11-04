// Basic TypeScript interfaces for the QA pipeline
// These will be enhanced with Zod schemas later

export interface QAConfig {
  maxTestDuration: number;
  screenshotDebounce: number;
  browserbaseTimeout: number;
}

export interface Screenshot {
  s3Url: string;
  timestamp: string;
  trigger: string;
}

export interface BasicQAResult {
  status: 'pass' | 'fail' | 'error';
  gameUrl: string;
  screenshots: Screenshot[];
  duration: number;
  error?: string;
}

// Additional utility types for development
export interface LoadResult {
  success: boolean;
  screenshot?: Screenshot;
  error?: string;
  loadTime: number;
}

export interface InteractionResult {
  action: string;
  success: boolean;
  screenshot?: Screenshot;
  error?: string;
}

