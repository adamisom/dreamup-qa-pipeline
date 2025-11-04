# Schemas Reference - DreamUp QA Pipeline

**🎯 Purpose**: Complete Zod schema definitions for type-safe data validation

## Core Schemas

### QA Report Schema

**Main output structure for all game evaluations:**

```typescript
import { z } from 'zod';

export const QAReportSchema = z.object({
  // Basic metadata
  gameUrl: z.string().url(),
  gameId: z.string(), // MD5 hash of URL
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid ISO 8601 datetime string"
  }),
  testDuration: z.number(), // milliseconds
  
  // Core evaluation results
  status: z.enum(['pass', 'fail', 'error']),
  playabilityScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  
  // Detailed findings
  issues: z.array(z.object({
    type: z.enum(['loading', 'interaction', 'ui', 'technical', 'gameplay']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    screenshot: z.string().optional() // S3 URL
  })),
  
  // Evidence artifacts
  screenshots: z.array(z.object({
    url: z.string().url(), // S3 presigned URL
    timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Must be a valid ISO 8601 datetime string"
    }),
    trigger: z.string(), // 'page-load', 'after-click', 'interval', etc.
    description: z.string().optional()
  })),
  
  // Game analysis
  gameAnalysis: z.object({
    engine: z.enum(['html5-canvas', 'webgl', 'dom', 'unity-webgl', 'unknown']),
    gameType: z.enum(['puzzle', 'platformer', 'clicker', 'rpg', 'arcade', 'unknown']),
    hasAudio: z.boolean(),
    hasKeyboardControls: z.boolean(),
    hasMouseControls: z.boolean(),
    requiresUserInteraction: z.boolean() // Click-to-play policies
  }),
  
  // Technical details
  technical: z.object({
    consoleLogs: z.string(), // S3 URL to logs file
    loadTime: z.number(), // milliseconds
    errorCount: z.number(),
    warningCount: z.number()
  })
});

export type QAReport = z.infer<typeof QAReportSchema>;
```

### Game Interaction Schema

**For tracking individual interaction attempts:**

```typescript
// Individual interaction attempt result
export const InteractionResultSchema = z.object({
  type: z.enum(['click', 'keyboard', 'scroll', 'wait']),
  target: z.string().optional(), // CSS selector or coordinate
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid ISO 8601 datetime string"
  }),
  screenshot: z.string().optional() // S3 URL if taken
});

// Sequence of interactions for a game test
export const InteractionSequenceSchema = z.array(InteractionResultSchema);

export type InteractionResult = z.infer<typeof InteractionResultSchema>;
export type InteractionSequence = z.infer<typeof InteractionSequenceSchema>;
```

### Configuration Schema

**Runtime configuration with defaults:**

```typescript
export const QAConfigSchema = z.object({
  // Timing controls
  maxTestDuration: z.number().default(270000), // 4.5 minutes
  screenshotDebounce: z.number().default(500), // milliseconds
  screenshotInterval: z.number().default(5000), // milliseconds
  maxScreenshots: z.number().default(20),
  
  // API settings
  browserbaseTimeout: z.number().default(60000),
  anthropicTimeout: z.number().default(30000),
  s3UploadTimeout: z.number().default(10000),
  
  // Feature flags (for Phase 5 enhanced detection)
  enableSmartDetection: z.boolean().default(false),
  enableDOMObserver: z.boolean().default(false),
  enableEventListening: z.boolean().default(false),
  
  // Retry settings
  maxRetries: z.number().default(3),
  retryBackoffMs: z.number().default(1000)
});

export type QAConfig = z.infer<typeof QAConfigSchema>;
```

### Error Classification Schema

**Structured error reporting:**

```typescript
export const GameErrorSchema = z.object({
  category: z.enum([
    'page_load_failed',
    'game_load_failed', 
    'interaction_failed',
    'game_crashed',
    'timeout_exceeded',
    'automation_detected',
    'consent_required',
    'unsupported_game_type'
  ]),
  message: z.string(),
  technical: z.string().optional(), // Stack trace, browser error
  recoverable: z.boolean(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid ISO 8601 datetime string"
  })
});

export type GameError = z.infer<typeof GameErrorSchema>;
```

### S3 Artifact Metadata Schema

**Metadata for files stored in S3:**

```typescript
export const S3ArtifactSchema = z.object({
  key: z.string(), // S3 object key
  url: z.string().url(), // Presigned URL
  contentType: z.string(),
  size: z.number(), // bytes
  uploadedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid ISO 8601 datetime string"
  }),
  expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid ISO 8601 datetime string"
  }) // Presigned URL expiry
});

export type S3Artifact = z.infer<typeof S3ArtifactSchema>;
```

## Usage Examples

### Validating LLM Response

```typescript
// Validating LLM response
const llmResponse = {
  status: 'pass',
  playabilityScore: 85,
  confidence: 0.92,
  gameUrl: 'https://example.com/game',
  gameId: 'abc123',
  timestamp: '2025-11-03T10:30:00Z',
  testDuration: 45000,
  issues: [],
  screenshots: [...],
  gameAnalysis: {...},
  technical: {...}
};

try {
  const validatedReport = QAReportSchema.parse(llmResponse);
  console.log('✅ Valid QA Report');
} catch (error) {
  console.log('❌ Invalid QA Report:', error.errors);
}
```

### Configuration Loading with Defaults

```typescript
// Configuration loading with defaults
const config = QAConfigSchema.parse({
  maxTestDuration: 300000, // Override default
  maxRetries: 5, // Override default
  // Other fields use defaults from schema
});

console.log('Screenshot debounce:', config.screenshotDebounce); // 500 (default)
console.log('Max retries:', config.maxRetries); // 5 (overridden)
```

### Error Handling with Structured Data

```typescript
// Error handling with structured data
try {
  await runGameTest(gameUrl);
} catch (error) {
  const gameError = GameErrorSchema.parse({
    category: 'game_load_failed',
    message: error.message,
    technical: error.stack,
    recoverable: false,
    timestamp: new Date().toISOString()
  });
  
  console.log('Structured error:', gameError);
}
```

### Creating Interaction Results

```typescript
// Recording interaction attempts
const interactions: InteractionResult[] = [];

// Success case
interactions.push({
  type: 'click',
  target: 'button[class*="start"]',
  success: true,
  timestamp: new Date().toISOString(),
  screenshot: 's3://bucket/game123/screenshot-001.png'
});

// Failure case
interactions.push({
  type: 'keyboard',
  target: 'ArrowRight',
  success: false,
  error: 'Element not found',
  timestamp: new Date().toISOString()
});

// Validate sequence
const validatedSequence = InteractionSequenceSchema.parse(interactions);
```

### S3 Artifact Tracking

```typescript
// Track uploaded files
const artifact: S3Artifact = {
  key: 'game123/20251103/screenshot-001.png',
  url: 'https://s3.amazonaws.com/bucket/game123/...',
  contentType: 'image/png',
  size: 245760, // bytes
  uploadedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
};

const validatedArtifact = S3ArtifactSchema.parse(artifact);
```

## Schema Validation Best Practices

### 1. Always Validate External Data

```typescript
// Before processing LLM responses
const rawLLMResponse = await anthropicClient.generate(...);
const safeReport = QAReportSchema.parse(rawLLMResponse);

// Before using configuration
const rawConfig = loadConfigFromEnv();
const safeConfig = QAConfigSchema.parse(rawConfig);
```

### 2. Use SafeParse for Optional Validation

```typescript
// When validation failure should not crash
const result = QAReportSchema.safeParse(suspiciousData);
if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.log('Validation errors:', result.error.errors);
}
```

### 3. Partial Updates

```typescript
// For configuration updates
const PartialConfigSchema = QAConfigSchema.partial();
const configUpdate = PartialConfigSchema.parse({
  maxRetries: 5 // Only update this field
});
```

### 4. Custom Validation

```typescript
// Add custom business logic
const EnhancedQAReportSchema = QAReportSchema.refine(
  (data) => {
    // Confidence should be high for pass status
    if (data.status === 'pass' && data.confidence < 0.7) {
      return false;
    }
    return true;
  },
  {
    message: "Pass status requires confidence >= 0.7"
  }
);
```

## Error Handling Patterns

### Schema Validation Errors

```typescript
try {
  const report = QAReportSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.log(`${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

### Type-Safe Error Creation

```typescript
// Helper function for consistent error creation
function createGameError(
  category: GameError['category'],
  message: string,
  recoverable: boolean = false
): GameError {
  return GameErrorSchema.parse({
    category,
    message,
    recoverable,
    timestamp: new Date().toISOString()
  });
}

// Usage
const error = createGameError('page_load_failed', 'Network timeout', false);
```

---

**📖 Related**: See `docs/IMPLEMENTATION_TASKS.md` for using these schemas in development tasks.
