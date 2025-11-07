# Architecture Deep Dive - DreamUp QA Pipeline

**🎯 Purpose**: Comprehensive system design and technical architecture

## System Overview

The DreamUp QA Pipeline is a distributed system that leverages cloud services for browser automation and AI evaluation. All heavy computational tasks (browser rendering, LLM processing) happen externally, making the core application lightweight and Lambda-deployable.

## High-Level Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        QA Pipeline Entry                         │
│                  (CLI / Lambda Invocation)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     1. INITIALIZATION                            │
│  • Validate game URL                                             │
│  • Initialize Browserbase session                                │
│  • Set timeouts & retry logic                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. BROWSER AGENT                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Browserbase Cloud          │ Stagehand SDK               │   │
│  │ • Chrome instance          │ • act() - click buttons     │   │
│  │ • Remote control           │ • observe() - find elements │   │
│  │ • Session replay           │ • extract() - get data      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Actions:                                                        │
│  1. Load game URL                                                │
│  2. Wait for initial render                                      │
│  3. Detect UI patterns (start buttons, menus)                    │
│  4. Attempt basic interactions (click start, simple keyboard)    │
│  5. Monitor for crashes/errors                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     3. EVIDENCE CAPTURE                          │
│  • Take 3-5 timestamped screenshots (debounced)                  │
│  • Capture console logs/errors                                   │
│  • Record interaction results                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     4. LLM EVALUATION                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Claude 3.5 Sonnet via Vercel AI SDK                      │   │
│  │ • Vision analysis of screenshots                         │   │
│  │ • Structured JSON output (Zod schema)                    │   │
│  │ • Confidence scoring                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Evaluates:                                                      │
│  • Did game load successfully?                                   │
│  • Are controls responsive?                                      │
│  • Did it crash or freeze?                                       │
│  • Overall playability and user experience                       │
│  • Playability score (0-100)                                     │
│  • Confidence score (0-1)                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     5. ARTIFACT STORAGE                          │
│  AWS S3: s3://dreamup-qa-results/{gameId}/{timestamp}/          │
│  ├── screenshot-001.png                                          │
│  ├── screenshot-002.png                                          │
│  ├── console-logs.txt                                            │
│  └── report.json                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     6. REPORT GENERATION                         │
│  {                                                               │
│    "status": "pass" | "fail",                                    │
│    "playabilityScore": 85,                                       │
│    "confidence": 0.92,                                           │
│    "issues": [...],                                              │
│    "screenshots": ["s3://...", ...],                             │
│    "timestamp": "2025-11-03T10:30:00Z"                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
┌──────────────┐     API calls      ┌──────────────┐
│   Your Code  │◄──────────────────►│ Browserbase  │
│  (Local/AWS) │                     │   (Cloud)    │
└──────┬───────┘                     └──────────────┘
       │
       │ API calls
       ▼
┌──────────────┐                     ┌──────────────┐
│   Claude     │                     │   AWS S3     │
│ (via AI SDK) │                     │  (Storage)   │
└──────────────┘                     └──────────────┘
```

**Key Insight:** All heavy lifting (browser, LLM) happens in external services. Your code orchestrates via API calls. This makes Lambda deployment trivial.

## Core Components

### 0. Utility Layer (Refactored)

**Shared Utilities:**
- **game-id.ts**: Consistent game ID generation (MD5 hash)
- **http-responses.ts**: Lambda handler response utilities (CORS, success, error)
- **console-reports.ts**: Safe console report generation with error handling
- **errors.ts**: Consistent error message extraction
- **timing.ts**: Sleep and duration tracking
- **validation.ts**: URL validation
- **results.ts**: Result object creation helpers
- **screenshots.ts**: Screenshot collection management
- **retry.ts**: Exponential backoff retry logic

**Design Pattern**: Pure functions and utilities for code reuse and testability.

### 1. Browser Automation Layer

**Technology Stack:**
- **Browserbase**: Cloud browser infrastructure
- **Stagehand**: AI-optimized browser automation SDK
- **Chrome**: Actual browser engine (hosted remotely)

**Responsibilities:**
- Remote browser session management
- Game navigation and interaction
- Screenshot capture
- Console log monitoring
- Error detection

**Key Design Decisions:**
- **Cloud-First**: No local browser dependencies
- **Stateless Sessions**: Each test creates fresh browser instance
- **Timeout Protection**: Max 5 minutes per test session
- **Session Cleanup**: Automatic cleanup on completion/failure

### 2. Evidence Capture System

**Screenshot Strategy:**
- **Debounced Capture**: 500ms cooldown between screenshots (configurable)
- **Event-Driven**: Screenshots after key interactions (load, post-load)
- **Immediate S3 Upload**: No in-memory accumulation
- **Presigned URLs**: 24-hour expiry for external access
- **Organized Storage**: `{gameId}/{timestamp}/screenshot-{timestamp}.png`

**Console Logging (ConsoleCapture):**
- **Real-time Capture**: Browser console events via page.on('console')
- **Error Capture**: Page errors via page.on('pageerror')
- **Noise Filtering**: Removes analytics, extensions, favicon messages
- **Error/Warning Preservation**: All errors and warnings kept regardless of content
- **Categorization**: Errors, warnings, info, log, debug levels
- **S3 Upload**: Filtered logs uploaded as JSON with metadata
- **Report Generation**: Includes error count, warning count, and formatted string

### 3. LLM Evaluation Engine

**Current Implementation (Phase 2):**
- **SimpleEvaluator**: Heuristic-based evaluation (MVP)
- **Console Error Detection**: Analyzes console logs for error patterns
- **Screenshot Validation**: Checks for valid screenshot URLs
- **Basic Status**: Returns pass/fail/error based on evidence

**Future Implementation (Phase 5):**
- **Claude 3.5 Sonnet**: Vision analysis model
- **Vercel AI SDK**: Structured output generation
- **Zod Schemas**: Type-safe validation
- **Structured Scoring**: 0-100 playability score
- **Confidence Assessment**: 0-1 confidence in evaluation
- **Issue Detection**: Categorized problem identification
- **Game Classification**: Engine and genre detection

### 4. Storage & Artifact Management

**S3 Organization:**
```
s3://dreamup-qa-results/
├── {gameId}/                    # MD5 hash of game URL (via generateGameId utility)
│   ├── {timestamp}/             # ISO 8601 timestamp
│   │   ├── screenshot-{ms}.png  # Timestamped screenshots
│   │   ├── screenshot-{ms}.png
│   │   ├── console-logs.json    # Structured log data (ConsoleReport)
│   │   └── qa-report.json       # Final evaluation (future)
│   └── {timestamp2}/
└── {gameId2}/
```

**Key Implementation Details:**
- **Game ID Generation**: Consistent MD5 hash via `generateGameId()` utility
- **Screenshot Keys**: Generated via `S3StorageClient.generateScreenshotKey()`
- **Console Logs**: Uploaded via `S3StorageClient.uploadLogs()` with retry logic
- **Presigned URLs**: 24-hour expiry for all artifacts

**Artifact Types:**
- **Screenshots**: PNG format, immediate upload
- **Console Logs**: JSON structured, filtered content
- **QA Reports**: Full evaluation results
- **Metadata**: File sizes, timestamps, expiry dates

**Access Control:**
- **Presigned URLs**: 24-hour expiry for viewing
- **Private Bucket**: No public read access
- **IAM Roles**: Minimal required permissions

### 5. Configuration Management

**Environment Variables:**
```bash
# Required
BROWSERBASE_API_KEY=xxx
BROWSERBASE_PROJECT_ID=xxx
ANTHROPIC_API_KEY=xxx
S3_BUCKET_NAME=xxx
AWS_REGION=xxx

# Optional (with defaults)
MAX_TEST_DURATION=270000  # 4.5 minutes
SCREENSHOT_DEBOUNCE=500   # milliseconds
BROWSERBASE_TIMEOUT=60000 # milliseconds

# AWS Credentials (optional if using IAM roles)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

**Runtime Configuration:**
- **Config Class**: Type-safe config loading via `Config.load()`
- **Validation**: `Config.validate()` checks required env vars
- **Defaults**: Sensible fallback values
- **Environment Access**: `Config.getEnv()` for direct access

## Data Flow Architecture

### Request Processing Pipeline

```typescript
// 1. Input Validation
const gameUrl = validateGameUrl(input.url); // isValidUrl() utility

// 2. Session Initialization  
const stagehandClient = new StagehandClient();
await stagehandClient.initialize();
const screenshotManager = new ScreenshotManager(stagehandClient, gameUrl);
const consoleCapture = new ConsoleCapture(stagehandClient, gameUrl);
await consoleCapture.startCapturing();

// 3. Game Loading
const gameLoader = new GameLoader(stagehandClient, screenshotManager);
const loadResult = await gameLoader.loadGame(gameUrl);

// 4. Evidence Collection
const screenshots = new ScreenshotCollection(); // Utility for managing screenshots
screenshots.add(loadResult.screenshot);
const consoleLogsUrl = await generateConsoleReportSafely(consoleCapture); // Utility

// 5. Evaluation (SimpleEvaluator - MVP)
const evaluator = new SimpleEvaluator();
const result = evaluator.evaluate(
  screenshots.getAll(),
  gameUrl,
  duration.elapsed(),
  consoleCapture.getLogsAsString()
);

// 6. Result Assembly
result.consoleLogsUrl = consoleLogsUrl; // Add console logs URL
return result; // BasicQAResult with status, screenshots, consoleLogsUrl
```

### Memory Management Strategy

**Problem**: Screenshots are large (100KB-2MB each)
**Solution**: Immediate S3 upload, store URLs only

```typescript
class ScreenshotManager {
  private screenshotUrls: string[] = []; // Store S3 URLs, not buffers
  
  async takeScreenshot(trigger: string): Promise<void> {
    const buffer = await this.browser.screenshot();
    
    // Upload immediately, don't accumulate in memory
    const s3Url = await this.s3Client.upload(buffer);
    this.screenshotUrls.push(s3Url);
    
    // Buffer is garbage collected automatically
  }
}
```

### Error Handling Architecture

**Layered Error Handling:**
1. **Network Layer**: Retry with exponential backoff
2. **API Layer**: Graceful degradation for service failures  
3. **Business Layer**: Structured error classification
4. **User Layer**: Meaningful error messages

**Error Classification:**
```typescript
enum ErrorCategory {
  PAGE_LOAD_FAILED = 'page_load_failed',
  GAME_LOAD_FAILED = 'game_load_failed', 
  INTERACTION_FAILED = 'interaction_failed',
  AUTOMATION_DETECTED = 'automation_detected',
  TIMEOUT_EXCEEDED = 'timeout_exceeded'
}
```

**Recovery Strategies:**
- **Transient Failures**: Automatic retry (3x with backoff)
- **Authentication**: Re-authenticate and retry once
- **Rate Limiting**: Exponential backoff with jitter
- **Permanent Failures**: Fail fast with structured error

## Scalability Considerations

### Current Architecture (MVP)
- **Concurrent Sessions**: 1 (Browserbase free tier)
- **Test Duration**: 5 minutes max per test
- **Storage**: Unlimited (S3)
- **Cost**: ~$0.10-0.20 per test

### Scaling Strategy (Future)
1. **Horizontal Scaling**: Multiple Browserbase sessions
2. **Queue System**: SQS for batch processing
3. **Caching**: Redis for repeated game analysis
4. **CDN**: CloudFront for screenshot delivery

### Performance Optimizations

**Current Optimizations:**
- **Debounced Screenshots**: Prevent spam capture
- **Immediate Upload**: No memory accumulation
- **Session Cleanup**: Prevent resource leaks
- **Timeout Protection**: Prevent hanging tests

**Future Optimizations:**
- **Screenshot Compression**: Reduce S3 costs
- **Parallel Processing**: Multiple games simultaneously
- **Caching**: Reuse evaluations for same game versions
- **Smart Detection**: Reduce unnecessary screenshots

## Security Architecture

### API Security
- **API Keys**: Environment variable storage only
- **HTTPS**: All external communications encrypted
- **Rate Limiting**: Prevent abuse of external services
- **Input Validation**: URL and parameter sanitization

### Data Security
- **Private S3 Bucket**: No public access
- **Presigned URLs**: Time-limited access (24h)
- **IAM Roles**: Principle of least privilege
- **No Sensitive Data**: Game URLs only, no user data

### Lambda Security
- **VPC**: Optional VPC deployment for enhanced isolation
- **IAM Roles**: Function-specific permissions
- **Environment Variables**: Encrypted at rest
- **CloudWatch Logs**: Structured logging for monitoring

## Deployment Architecture

### Local Development
```
Developer Machine
├── Node.js Runtime
├── TypeScript Compiler  
├── Environment Variables (.env)
└── API Connections
    ├── Browserbase (remote)
    ├── Claude (remote) 
    └── S3 (remote)
```

### Lambda Production
```
AWS Lambda Function (handler.ts)
├── Handler Function
│   ├── CORS Headers (via http-responses utility)
│   ├── Request Validation
│   ├── Error Handling (via http-responses utility)
│   └── QA Test Execution (runQATest)
├── Dependencies (bundled)
├── Environment Variables (encrypted)
└── IAM Role
    ├── S3 Permissions (read/write)
    └── CloudWatch Logs
```

**Handler Implementation:**
- **API Gateway Integration**: Handles POST requests with JSON body
- **CORS Support**: Preflight (OPTIONS) and actual requests
- **Error Responses**: Structured error responses with proper HTTP status codes
- **Request Validation**: Validates gameUrl in request body
- **Response Formatting**: Consistent JSON responses via http-responses utilities

### External Services
```
Browserbase Cloud
├── Chrome Browser Instances
├── Session Management
└── Screenshot Capture

Anthropic Claude
├── Vision Model
├── Structured Output
└── Rate Limiting

AWS S3
├── Screenshot Storage
├── Log Storage  
└── Report Storage
```

## Monitoring & Observability

### Metrics to Track
- **Test Success Rate**: % of successful completions
- **Average Test Duration**: Performance monitoring
- **API Response Times**: External service health
- **Error Rates**: Failure categorization
- **Cost per Test**: Economic efficiency

### Logging Strategy
```typescript
// Structured logging with context
logger.info('Game test started', {
  gameUrl,
  gameId, 
  timestamp,
  sessionId: browserSession.id
});

logger.error('Screenshot upload failed', {
  gameId,
  screenshotCount,
  error: error.message,
  retryAttempt: 2
});
```

### Alerting
- **High Error Rates**: > 10% failure rate
- **Long Test Durations**: > 4 minutes average
- **API Failures**: External service issues
- **Cost Overruns**: Unexpected expense spikes

---

**📖 Related**: See `docs/DEPLOYMENT_GUIDE.md` for production deployment details.
