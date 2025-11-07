# DreamUp Browser Game QA Pipeline - Product Requirements Document

**Version:** 1.0  
**Date:** November 3, 2025  
**Project Timeline:** 5-7 days  
**Priority:** Speed of Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack](#tech-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Development Phases](#development-phases)
5. [Detailed Task Breakdown](#detailed-task-breakdown)
6. [Risks to Mitigate](#risks-to-mitigate)
7. [Setup Instructions](#setup-instructions)
8. [Test Cases](#test-cases)
9. [Lambda Deployment Strategy](#lambda-deployment-strategy)
10. [Success Criteria](#success-criteria)
11. [Future: Feedback Loop Integration](#future-feedback-loop-integration-out-of-scope)

---

## Executive Summary

Build an AI-powered browser game QA automation system that:
- Tests HTML5/WebGL browser games from any URL  
- Simulates user interactions autonomously
- Captures visual evidence (screenshots)
- Evaluates playability using LLMs
- Outputs structured JSON reports
- Runs locally for development, deploys to AWS Lambda for production

**Game Scope**: HTML5 and WebGL games (covers 95%+ of modern browser games). Excludes Flash, Unity WebPlayer, and native applications.

**Business Value:** Enable automated QA for DreamUp's game-building pipeline, creating feedback loops for agent self-improvement.

---

## Tech Stack

### Core Technologies

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js | v20+ | Existing setup, Lambda-compatible |
| **Package Manager** | npm | Latest | Familiar, universal compatibility |
| **Language** | TypeScript | 5.x | Type safety, better AI code generation |
| **Browser Automation** | Browserbase + Stagehand | Latest | Cloud browsers, Lambda-ready, AI-optimized |
| **LLM Provider** | Anthropic Claude | 3.5 Sonnet | Best vision model for screenshot analysis |
| **LLM SDK** | Vercel AI SDK | 4.2+ | Structured outputs, clean abstraction |
| **Storage** | AWS S3 | SDK v3 | Persistent artifact storage |
| **Schema Validation** | Zod | Latest | Type-safe data validation |

### Key Dependencies

```json
{
  "@browserbasehq/stagehand": "latest",
  "@ai-sdk/anthropic": "latest", 
  "ai": "latest",
  "@aws-sdk/client-s3": "^3.x",
  "zod": "^3.x",
  "dotenv": "^16.x"
}
```

---

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

---

## Development Phases

### Phase 0: Setup & Scaffolding (Checkpoint 0)
**Complexity:** Low  
**Goal:** Get the starter template running locally

**Tasks:**
1. **Test Template Availability**
   - Verify `npx create-browser-app` command exists and works
   - Test template generation in temporary directory first
   - Check template includes expected dependencies (@browserbasehq/stagehand, etc.)
   - **Fallback Plan**: Manual project setup if template fails
2. Run `npx create-browser-app` and configure  
3. Obtain API keys (Browserbase, Anthropic, AWS)
4. Create S3 bucket: `dreamup-qa-results`
5. Configure `.env` file
6. Verify "Hello World" Stagehand script works

**Checkpoint Success Criteria:**
- ✅ Can run a basic Stagehand script that navigates to a URL
- ✅ Can see browser session in Browserbase dashboard
- ✅ Environment variables loaded correctly

**Manual Test:**
```bash
npm run dev  # Should open a browser to test URL
```

---

### Phase 1: Minimal Viable Prototype (Checkpoint 1)
**Complexity:** Medium  
**Goal:** Load a game, take 1 screenshot, pass/fail with simple heuristic (NO LLM YET)

**Tasks:**
1. Create `src/qa-agent.ts` entry point
2. Implement `loadGame(url: string)` function
   - Initialize Stagehand with Browserbase config
   - Navigate to game URL
   - Wait for page load (simple timeout)
3. Implement `captureScreenshot()` function
   - Take single screenshot
   - Save to local `/temp` directory
4. Implement simple heuristic evaluation
   - Check if page loaded (no error page)
   - Check for console errors
   - Return basic JSON: `{ status: "pass" | "fail", reason: string }`
5. Add CLI interface: `npm run qa <game-url>`

**Checkpoint Success Criteria:**
- ✅ Can load a simple game URL (e.g., tic-tac-toe from itch.io)
- ✅ Screenshot saved locally
- ✅ JSON output shows pass/fail
- ✅ Graceful error handling if URL fails

**Manual Test:**
```bash
npm run qa https://itch.io/games/html5/tag-simple
# Should output: { status: "pass", reason: "Page loaded successfully" }
```

**Files Created:**
- `src/qa-agent.ts` - Main entry point
- `src/browser/loader.ts` - Game loading logic
- `src/capture/screenshot.ts` - Screenshot capture
- `src/types.ts` - Type definitions

---

### Phase 2: True MVP with LLM Evaluation (Checkpoint 2)
**Complexity:** High  
**Goal:** Add AI evaluation of screenshots + basic game interaction

**Tasks:**
1. **Integrate Vercel AI SDK**
   - Install `@ai-sdk/anthropic` and `ai`
   - Create `src/llm/evaluator.ts`
   - Implement `evaluateScreenshots()` using `generateObject()`
   - Define Zod schema for evaluation output

2. **Add Basic Interaction**
   - Implement `findAndClickStart()` - Use Stagehand's `act()` to find start button
   - Implement `simulateBasicGameplay()` - Simple keyboard inputs (arrow keys, space)
   - Take screenshots at key moments (start, mid-game, end)

3. **Structured Output**
   - Define `QAReportSchema` using Zod
   - Map LLM response to structured JSON
   - Include: `playabilityScore`, `confidence`, `issues[]`

4. **Enhanced Error Handling**
   - Timeout protection (max 5 minutes)
   - Retry logic for page load failures (3 attempts)
   - Graceful degradation if screenshots fail

**Checkpoint Success Criteria:**
- ✅ Can test a simple clicker game end-to-end
- ✅ LLM analyzes 3+ screenshots
- ✅ JSON report includes playability score (0-100)
- ✅ Handles at least one failure mode gracefully

**Manual Test:**
```bash
npm run qa https://itch.io/embed/123456  # Simple clicker game
# Should output full structured JSON with LLM evaluation
```

**Files Modified/Created:**
- `src/llm/evaluator.ts` - NEW
- `src/llm/prompts.ts` - NEW (structured prompts)
- `src/browser/interactions.ts` - NEW
- `src/schemas/report.ts` - NEW (Zod schemas)
- `src/qa-agent.ts` - UPDATED (integrate LLM)

---

### Phase 3: S3 Integration & Robust Testing (Checkpoint 3)
**Complexity:** Medium  
**Goal:** Upload artifacts to S3, test on 3+ diverse games

**Tasks:**
1. **S3 Storage Implementation**
   - Create `src/storage/s3-client.ts`
   - Implement `uploadScreenshot()`, `uploadReport()`, `uploadLogs()`
   - Generate presigned URLs for easy viewing
   - Folder structure: `{gameId}/{timestamp}/`

2. **Console Log Capture**
   - Capture browser console logs
   - Save as `console-logs.txt` to S3
   - Include in LLM evaluation context

3. **Test Suite Development**
   - Test against 3 diverse games:
     1. Simple puzzle (tic-tac-toe)
     2. Platformer with keyboard controls
     3. Idle/clicker game
   - Document results in `test-results/` directory

4. **Refinement**
   - Tune LLM prompts based on test results
   - Adjust timeouts and retry logic
   - Improve interaction detection

**Checkpoint Success Criteria:**
- ✅ All artifacts (screenshots, logs, JSON) uploaded to S3
- ✅ Successfully tested 3 different game types
- ✅ 80%+ accuracy on playability assessment (manual validation)
- ✅ Presigned URLs work for viewing screenshots

**Manual Test:**
```bash
npm run qa <game-url>
# 1. Check S3 bucket for uploaded files
# 2. Click presigned URL in JSON output
# 3. Verify screenshot loads in browser
```

**Files Created:**
- `src/storage/s3-client.ts` - NEW
- `src/capture/console-logs.ts` - NEW
- `test-results/game-1-report.json` - NEW (example reports)

---

### Phase 4: Production Polish & Documentation (Checkpoint 4)
**Complexity:** Medium  
**Goal:** Clean code, documentation, demo video, Lambda preparation

**Tasks:**
1. **Code Quality**
   - Add JSDoc comments
   - Extract magic numbers to config
   - Clean up console.logs, add proper logging
   - Add input validation

2. **Documentation**
   - Write comprehensive README.md
   - Include setup instructions
   - Add usage examples
   - Document architecture decisions

3. **TypeScript Improvements**
   - Ensure strict type checking
   - Export clean public API
   - Add missing type definitions

4. **Lambda Preparation**
   - Create `handler.ts` for Lambda entry point
   - Test Lambda-style invocation locally
   - Document environment variables needed
   - Create deployment guide

5. **Demo Video**
   - Record 2-5 minute demo
   - Show end-to-end execution
   - Demonstrate 3 test cases

**Checkpoint Success Criteria:**
- ✅ README explains setup in <5 minutes
- ✅ Code is well-documented and modular
- ✅ Can invoke as Lambda function locally (using `lambda-local` or similar)
- ✅ Demo video completed

**Deliverables:**
- `README.md` - Comprehensive documentation
- `docs/ARCHITECTURE.md` - Technical deep dive
- `docs/LAMBDA_DEPLOY.md` - Deployment guide
- `demo-video.mp4` - 2-5 minute walkthrough

---

### Phase 5 (Optional): Stretch Features
**Duration:** Variable  
**Goal:** Add nice-to-have features if time permits

**Potential Features:**
1. **GIF Recording** - Capture gameplay as animated GIF
2. **Batch Testing** - Test multiple URLs sequentially
3. **Advanced Metrics** - FPS monitoring, load time analysis
4. **Web Dashboard** - Simple HTML interface for viewing results
5. **Comparison Testing** - Compare same game across different sessions

**Note:** Only pursue if Phases 1-4 are solidly complete.

---

## Zod Schemas & Data Structures

### Core QA Report Schema

```typescript
import { z } from 'zod';

// Main QA report structure
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

```typescript
// Runtime configuration
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

```typescript
// Structured error reporting
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

```typescript
// Metadata for files stored in S3
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

### Usage Examples

```typescript
// Validating LLM response
const llmResponse = {
  status: 'pass',
  playabilityScore: 85,
  confidence: 0.92,
  // ... other fields
};

const validatedReport = QAReportSchema.parse(llmResponse);

// Configuration loading with defaults
const config = QAConfigSchema.parse({
  maxTestDuration: 300000, // Override default
  // Other fields use defaults
});

// Error handling with structured data
try {
  await runGameTest(gameUrl);
} catch (error) {
  const gameError = GameErrorSchema.parse({
    category: 'game_load_failed',
    message: error.message,
    recoverable: false,
    timestamp: new Date().toISOString()
  });
}
```

---

## Game Interaction Strategies

### Phase 1: Simple Debounced Interactions

**Screenshot Strategy**: Debounced screenshots (500ms) + interval fallback (5s) for reliable capture without cost explosion.

**Why This Approach**:
- ✅ **Cost controlled**: Max 1 screenshot per 500ms, ~10-20 total per test
- ✅ **Captures key moments**: Screenshots after interactions show cause-and-effect
- ✅ **Universal compatibility**: Works for all game types without complex detection
- ✅ **Predictable**: Easy to debug, reliable timing

```typescript
// Phase 1 - Screenshot management with debouncing
class DebounceScreenshotManager {
  private lastScreenshotTime = 0;
  private readonly DEBOUNCE_MS = 500; // 500ms cooldown
  private screenshotUrls: string[] = []; // Store S3 URLs, not buffers
  
  async takeScreenshotIfReady(reason: string): Promise<boolean> {
    const now = Date.now();
    
    if (now - this.lastScreenshotTime >= this.DEBOUNCE_MS) {
      const screenshot = await this.stagehand.page.screenshot();
      
      // Upload immediately to S3, don't store in memory
      const s3Key = `${this.gameId}/${this.timestamp}/screenshot-${Date.now()}.png`;
      const s3Url = await this.s3Client.uploadScreenshot(s3Key, screenshot);
      
      this.screenshotUrls.push(s3Url);
      this.lastScreenshotTime = now;
      return true;
    }
    
    return false; // Debounced - too soon
  }
}

// Phase 1 - Simple interaction strategy with screenshot management
class SimpleGameTester {
  private screenshotManager = new DebounceScreenshotManager();
  private intervalTimer: NodeJS.Timeout;
  
  async testGame(gameUrl: string): Promise<QAReport> {
    // Always: initial page load
    await this.stagehand.goto(gameUrl);
    await this.screenshotManager.takeScreenshot('page-load');
    
    // Set up interval fallback (ensures regular screenshots even during idle periods)
    this.intervalTimer = setInterval(async () => {
      await this.screenshotManager.takeScreenshotIfReady('interval-fallback');
    }, 5000);
    
    try {
      // Standard interaction sequence with debounced screenshots
      const interactions = [
        () => this.attemptGameStart(),
        () => this.attemptBasicClick(), 
        () => this.attemptKeyboardInput(),
        () => this.waitAndObserve(15000)
      ];
      
      for (const interaction of interactions) {
        await interaction();
        // Each interaction attempts screenshot, but respects debounce
        await this.screenshotManager.takeScreenshotIfReady('after-interaction');
        await this.wait(1000); // Brief pause between interactions
      }
    } finally {
      clearInterval(this.intervalTimer);
    }
    
    return this.generateSimpleReport();
  }
}
```

**Example Timeline**:
```
0s: Page load → Screenshot
2s: Click start → Screenshot (debounce OK)
2.3s: Try keyboard → No screenshot (debounced)
5s: Interval → Screenshot
7s: Click element → Screenshot (debounce OK)
12s: Interval → Screenshot
```

**Phase 5 Enhancement**: Add smart detection behind feature flags:
```typescript
// Phase 5 - Enhanced with optional smart detection
class EnhancedScreenshotManager extends DebounceScreenshotManager {
  constructor(private config: ScreenshotConfig) {
    super();
  }
  
  async shouldTakeScreenshot(trigger: string): Promise<boolean> {
    // Always respect debounce timing first
    if (!this.isDebounceReady()) return false;
    
    // Simple mode: just debounce + interval (Phase 1 default)
    if (!this.config.enableSmartDetection) {
      return trigger === 'interval-fallback' || trigger === 'after-interaction';
    }
    
    // Smart mode: add detection but with fallbacks (Phase 5)
    return await this.smartDetection(trigger) || this.fallbackLogic(trigger);
  }
}
```

### Phase 5: Enhanced Game-Type-Specific Strategies

**Implementation**: Adaptive interaction based on detected game type

```typescript
// Phase 5 - Smart interaction strategies
class SmartGameTester {
  async testGame(gameUrl: string): Promise<QAReport> {
    const gameType = await this.detectGameType();
    const strategy = this.getStrategyForGameType(gameType);
    return await strategy.execute(gameUrl);
  }
  
  private getStrategyForGameType(gameType: string): GameStrategy {
    switch (gameType) {
      case 'clicker': return new ClickerGameStrategy();
      case 'platformer': return new PlatformerGameStrategy();
      case 'puzzle': return new PuzzleGameStrategy();
      default: return new GenericGameStrategy();
    }
  }
}
```

### Game Type Detection Logic

```typescript
async function detectGameType(): Promise<string> {
  // Analyze page content for game type indicators
  const gameTypeClues = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    const title = document.title.toLowerCase();
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || '';
    
    const content = `${text} ${title} ${metaDescription}`;
    
    // Simple keyword-based classification
    if (content.match(/click|tap|idle|incremental/)) return 'clicker';
    if (content.match(/jump|platform|run|mario/)) return 'platformer';  
    if (content.match(/puzzle|match|solve|brain/)) return 'puzzle';
    if (content.match(/rpg|adventure|quest|character/)) return 'rpg';
    if (content.match(/shoot|space|arcade|action/)) return 'arcade';
    
    // DOM structure analysis
    const hasCanvas = document.querySelector('canvas') !== null;
    const hasGameContainer = document.querySelector('[class*="game"], [id*="game"]') !== null;
    
    if (hasCanvas && !hasGameContainer) return 'webgl'; // Likely Unity or complex canvas game
    if (hasGameContainer) return 'html5-dom'; // DOM-based game
    
    return 'unknown';
  });
  
  return gameTypeClues;
}
```

### Specific Game Strategies

#### Clicker Game Strategy
```typescript
class ClickerGameStrategy implements GameStrategy {
  async execute(gameUrl: string): Promise<InteractionSequence> {
    const interactions: InteractionResult[] = [];
    
    // 1. Load and start
    await this.stagehand.goto(gameUrl);
    interactions.push(await this.recordInteraction('load'));
    
    // 2. Find and click start/play button
    const startResult = await this.findAndClickStart();
    interactions.push(startResult);
    
    // 3. Perform rapid clicking sequence
    const clickTargets = await this.findClickableElements();
    for (let i = 0; i < 5; i++) {
      const clickResult = await this.performClick(clickTargets[0]);
      interactions.push(clickResult);
      await this.wait(1000); // Wait between clicks
    }
    
    // 4. Check for progression indicators
    const progressionCheck = await this.checkForProgression();
    interactions.push(progressionCheck);
    
    return interactions;
  }
  
  private async findClickableElements(): Promise<string[]> {
    return await this.stagehand.observe({
      instruction: "Find all clickable game elements like buttons, upgrades, or main click targets",
      useVision: false // Use DOM inspection for clicker games
    });
  }
}
```

#### Platformer Game Strategy
```typescript
class PlatformerGameStrategy implements GameStrategy {
  async execute(gameUrl: string): Promise<InteractionSequence> {
    const interactions: InteractionResult[] = [];
    
    // 1. Load and start
    await this.stagehand.goto(gameUrl);
    interactions.push(await this.recordInteraction('load'));
    
    // 2. Start game
    const startResult = await this.findAndClickStart();
    interactions.push(startResult);
    
    // 3. Test keyboard controls
    const keyboardTests = [
      { key: 'ArrowRight', description: 'move right' },
      { key: 'ArrowLeft', description: 'move left' },
      { key: 'Space', description: 'jump' },
      { key: 'ArrowUp', description: 'jump/interact' }
    ];
    
    for (const test of keyboardTests) {
      const keyResult = await this.testKeyboardInput(test.key, test.description);
      interactions.push(keyResult);
      await this.wait(2000); // Wait to observe result
    }
    
    // 4. Test combination inputs
    const comboResult = await this.testKeyboardCombo(['ArrowRight', 'Space']);
    interactions.push(comboResult);
    
    return interactions;
  }
  
  private async testKeyboardInput(key: string, description: string): Promise<InteractionResult> {
    try {
      await this.stagehand.page.keyboard.press(key);
      return {
        type: 'keyboard',
        target: key,
        success: true,
        timestamp: new Date().toISOString(),
        description: `Pressed ${key} to ${description}`
      };
    } catch (error) {
      return {
        type: 'keyboard',
        target: key,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

#### Puzzle Game Strategy
```typescript
class PuzzleGameStrategy implements GameStrategy {
  async execute(gameUrl: string): Promise<InteractionSequence> {
    const interactions: InteractionResult[] = [];
    
    // 1. Load and start
    await this.stagehand.goto(gameUrl);
    interactions.push(await this.recordInteraction('load'));
    
    // 2. Start game
    const startResult = await this.findAndClickStart();
    interactions.push(startResult);
    
    // 3. Find puzzle elements
    const puzzleElements = await this.findPuzzleElements();
    
    // 4. Attempt strategic moves
    for (const element of puzzleElements.slice(0, 3)) { // Test first 3 elements
      const moveResult = await this.attemptPuzzleMove(element);
      interactions.push(moveResult);
      await this.wait(2000); // Wait for animation/response
    }
    
    // 5. Test undo/reset if available
    const undoResult = await this.attemptUndo();
    if (undoResult.success) {
      interactions.push(undoResult);
    }
    
    return interactions;
  }
  
  private async findPuzzleElements(): Promise<string[]> {
    // Look for common puzzle game elements
    const selectors = [
      '[class*="tile"], [class*="piece"], [class*="block"]',
      '[data-row], [data-col], [data-x][data-y]',
      'canvas', // Canvas-based puzzle games
      '.game-board > *, .puzzle-grid > *'
    ];
    
    const elements: string[] = [];
    for (const selector of selectors) {
      const found = await this.stagehand.page.$$(selector);
      if (found.length > 0) {
        elements.push(selector);
      }
    }
    
    return elements;
  }
}
```

### Common Interaction Utilities

```typescript
// Shared utilities used by all strategies
class GameInteractionUtils {
  static async findAndClickStart(stagehand: any): Promise<InteractionResult> {
    const startSelectors = [
      'button:contains("Start")',
      'button:contains("Play")',
      'button:contains("Begin")',
      '[class*="start"], [class*="play"]',
      '#start, #play, #begin',
      '.btn-start, .btn-play'
    ];
    
    for (const selector of startSelectors) {
      try {
        const element = await stagehand.page.$(selector);
        if (element) {
          await element.click();
          return {
            type: 'click',
            target: selector,
            success: true,
            timestamp: new Date().toISOString(),
            description: 'Found and clicked start button'
          };
        }
      } catch (error) {
        continue; // Try next selector
      }
    }
    
    // Fallback: click center of screen (common for Canvas games)
    try {
      await stagehand.page.click('body', { position: { x: 400, y: 300 } });
      return {
        type: 'click',
        target: 'center-screen',
        success: true,
        timestamp: new Date().toISOString(),
        description: 'Clicked center of screen as fallback start'
      };
    } catch (error) {
      return {
        type: 'click',
        target: 'none',
        success: false,
        error: 'No start button found and center click failed',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  static async handleCommonDialogs(stagehand: any): Promise<void> {
    // Handle cookie consent, age verification, etc.
    const dialogSelectors = [
      'button:contains("Accept")',
      'button:contains("I Agree")',
      'button:contains("Continue")',
      '[data-testid="accept"], [data-testid="consent"]',
      '.cookie-accept, .gdpr-accept'
    ];
    
    for (const selector of dialogSelectors) {
      try {
        const element = await stagehand.page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          await stagehand.page.waitForTimeout(1000); // Wait for dialog to close
        }
      } catch (error) {
        // Ignore - dialog might not exist
      }
    }
  }
}
```

### gameId Generation Strategy

```typescript
// Consistent gameId generation for S3 storage
function generateGameId(gameUrl: string): string {
  // Clean URL for consistent hashing
  const cleanUrl = gameUrl
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/[?#].*$/, ''); // Remove query params and fragments
  
  // Generate MD5 hash (deterministic, collision-resistant for our use case)
  const crypto = require('crypto');
  return crypto.createHash('md5').update(cleanUrl).digest('hex');
}

// Usage example:
// gameUrl: "https://example.com/games/puzzle/?level=1"
// gameId: "a1b2c3d4e5f6789abcdef1234567890" (MD5 of "example.com/games/puzzle")
```

---

## Console Log Capture Implementation

### Technical Approach

Browser console logs provide crucial debugging information for game testing. Implementation uses Playwright's Chrome DevTools Protocol (CDP) integration.

```typescript
class ConsoleCapture {
  private logs: ConsoleMessage[] = [];
  private startTime: number;
  
  constructor(private page: any) {
    this.startTime = Date.now();
  }
  
  startCapturing(): void {
    // Listen for all console events
    this.page.on('console', (msg: any) => {
      this.logs.push({
        type: msg.type(), // 'log', 'warn', 'error', 'debug', etc.
        text: msg.text(),
        timestamp: Date.now(),
        relativeTime: Date.now() - this.startTime,
        location: msg.location() // File and line number if available
      });
    });
    
    // Listen for JavaScript errors
    this.page.on('pageerror', (error: Error) => {
      this.logs.push({
        type: 'error',
        text: `Unhandled Error: ${error.message}`,
        timestamp: Date.now(),
        relativeTime: Date.now() - this.startTime,
        stack: error.stack
      });
    });
    
    // Listen for failed requests (often cause game issues)
    this.page.on('requestfailed', (request: any) => {
      this.logs.push({
        type: 'error', 
        text: `Failed Request: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`,
        timestamp: Date.now(),
        relativeTime: Date.now() - this.startTime
      });
    });
  }
  
  async generateReport(): Promise<string> {
    // Classify and summarize logs
    const errorCount = this.logs.filter(log => log.type === 'error').length;
    const warningCount = this.logs.filter(log => log.type === 'warn').length;
    const gameRelevantLogs = this.filterGameRelevantLogs();
    
    const report = {
      summary: {
        totalLogs: this.logs.length,
        errorCount,
        warningCount,
        gameRelevantCount: gameRelevantLogs.length,
        captureStartTime: new Date(this.startTime).toISOString(),
        captureDuration: Date.now() - this.startTime
      },
      gameRelevantLogs: gameRelevantLogs,
      allLogs: this.logs // Full log for debugging
    };
    
    return JSON.stringify(report, null, 2);
  }
  
  private filterGameRelevantLogs(): ConsoleMessage[] {
    return this.logs.filter(log => {
      const text = log.text.toLowerCase();
      
      // Game-related keywords
      const gameKeywords = [
        'game', 'player', 'score', 'level', 'canvas', 'webgl',
        'unity', 'phaser', 'pixi', 'three.js', 'babylon'
      ];
      
      // Error indicators
      const errorIndicators = [
        'error', 'failed', 'exception', 'undefined', 'null',
        'cannot', 'unable', 'timeout', 'blocked'
      ];
      
      // Always include errors and warnings
      if (log.type === 'error' || log.type === 'warn') return true;
      
      // Include logs with game-relevant content
      return gameKeywords.some(keyword => text.includes(keyword)) ||
             errorIndicators.some(indicator => text.includes(indicator));
    });
  }
}
```

### Integration with Stagehand

```typescript
// Integration with the main testing flow
class QAAgent {
  private consoleCapture: ConsoleCapture;
  
  async testGame(gameUrl: string): Promise<QAReport> {
    // Initialize console capture before navigation
    this.consoleCapture = new ConsoleCapture(this.stagehand.page);
    this.consoleCapture.startCapturing();
    
    // Perform game testing...
    await this.stagehand.goto(gameUrl);
    // ... rest of testing logic
    
    // Generate console report
    const consoleReport = await this.consoleCapture.generateReport();
    
    // Upload to S3
    const consoleLogKey = `${gameId}/${timestamp}/console-logs.json`;
    const consoleLogUrl = await this.s3Client.uploadFile(
      consoleLogKey,
      Buffer.from(consoleReport, 'utf-8'),
      'application/json'
    );
    
    return {
      // ... other report fields
      technical: {
        consoleLogs: consoleLogUrl,
        errorCount: JSON.parse(consoleReport).summary.errorCount,
        warningCount: JSON.parse(consoleReport).summary.warningCount
      }
    };
  }
}
```

### Console Message Classification

```typescript
interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'debug' | 'info';
  text: string;
  timestamp: number;
  relativeTime: number; // Milliseconds since capture start
  location?: string; // File:line if available
  stack?: string; // For errors
  category?: 'game' | 'framework' | 'browser' | 'ad' | 'analytics';
}

// Automatic categorization logic
function categorizeConsoleMessage(msg: ConsoleMessage): ConsoleMessage {
  const text = msg.text.toLowerCase();
  
  // Game engine detection
  if (text.includes('unity') || text.includes('unityloader')) {
    msg.category = 'game';
  } else if (text.includes('phaser') || text.includes('pixi') || text.includes('three')) {
    msg.category = 'framework';
  } else if (text.includes('google') || text.includes('analytics') || text.includes('gtag')) {
    msg.category = 'analytics';
  } else if (text.includes('ad') || text.includes('doubleclick') || text.includes('googletagservices')) {
    msg.category = 'ad';
  } else if (text.includes('cors') || text.includes('mixed content') || text.includes('security')) {
    msg.category = 'browser';
  } else {
    msg.category = 'game'; // Default assumption for game testing
  }
  
  return msg;
}
```

### Performance Monitoring

```typescript
// Enhanced console capture with performance metrics
class EnhancedConsoleCapture extends ConsoleCapture {
  private performanceEntries: PerformanceEntry[] = [];
  
  startCapturing(): void {
    super.startCapturing();
    
    // Capture performance metrics
    this.page.evaluate(() => {
      // Monitor FPS for games
      let frameCount = 0;
      let lastTime = performance.now();
      
      function countFrame() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          console.log(`[PERF] FPS: ${frameCount}`);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(countFrame);
      }
      
      // Start FPS monitoring for canvas games
      if (document.querySelector('canvas')) {
        requestAnimationFrame(countFrame);
      }
      
      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            console.log(`[PERF] ${entry.entryType}: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
    });
  }
}
```

### Error Pattern Recognition

```typescript
// Common game error patterns and their implications
const GAME_ERROR_PATTERNS = {
  'canvas': {
    patterns: [/canvas/i, /webgl/i, /context/i],
    implications: ['Rendering issues', 'Hardware acceleration problems'],
    severity: 'high'
  },
  'audio': {
    patterns: [/audio/i, /sound/i, /webaudio/i],
    implications: ['Audio system failure', 'Browser audio policy issues'], 
    severity: 'medium'
  },
  'loading': {
    patterns: [/404/i, /failed to load/i, /cannot load/i],
    implications: ['Missing game assets', 'Network connectivity issues'],
    severity: 'high'
  },
  'input': {
    patterns: [/keyboard/i, /mouse/i, /touch/i, /input/i],
    implications: ['Control system failure', 'Event handler issues'],
    severity: 'high'
  },
  'memory': {
    patterns: [/memory/i, /out of/i, /allocation/i],
    implications: ['Memory leak', 'Resource exhaustion'],
    severity: 'critical'
  }
};

function analyzeErrorPatterns(logs: ConsoleMessage[]): IssueReport[] {
  const issues: IssueReport[] = [];
  
  for (const [category, config] of Object.entries(GAME_ERROR_PATTERNS)) {
    const matchingLogs = logs.filter(log => 
      config.patterns.some(pattern => pattern.test(log.text))
    );
    
    if (matchingLogs.length > 0) {
      issues.push({
        type: 'technical',
        severity: config.severity,
        description: `${category} issues detected (${matchingLogs.length} occurrences)`,
        implications: config.implications,
        evidence: matchingLogs.map(log => log.text)
      });
    }
  }
  
  return issues;
}
```

---

## Error Classification & Handling Strategy

### Error Categories

Clear categorization enables appropriate handling and meaningful reports:

```typescript
enum GameTestResult {
  // Successful outcomes
  PLAYABLE = 'playable',           // Game works well, score 70-100
  PARTIALLY_PLAYABLE = 'partial',  // Some issues but functional, score 40-69
  
  // Failure outcomes  
  BROKEN = 'broken',               // Game has serious issues, score 0-39
  UNRESPONSIVE = 'unresponsive',   // Game loads but doesn't respond, score 0-20
  FAILED_TO_LOAD = 'failed_load',  // Game never loads, score 0
  
  // Special cases
  UNSUPPORTED = 'unsupported',     // Non-HTML5/WebGL game type
  BLOCKED = 'blocked',             // Automation detected or access denied
  TIMEOUT = 'timeout'              // Test exceeded time limits
}
```

### Detailed Error Classification

#### 1. Page Load Failures
```typescript
interface PageLoadError {
  category: 'page_load_failed';
  subcategory: '404' | 'timeout' | 'network' | 'dns' | 'ssl';
  recoverable: false;
  playabilityScore: 0;
  userMessage: string;
}

// Common patterns:
const PAGE_LOAD_PATTERNS = {
  '404': {
    indicators: ['404', 'not found', 'page not found'],
    message: 'Game page does not exist',
    score: 0
  },
  'timeout': {
    indicators: ['timeout', 'took too long', 'connection timed out'],
    message: 'Game page failed to load within time limit',
    score: 0
  },
  'network': {
    indicators: ['network error', 'connection refused', 'unreachable'],
    message: 'Network connectivity issues prevented loading',
    score: 0
  }
};
```

#### 2. Game Load Failures  
```typescript
interface GameLoadError {
  category: 'game_load_failed';
  subcategory: 'missing_assets' | 'js_error' | 'plugin_required' | 'browser_incompatible';
  recoverable: boolean;
  playabilityScore: 0 | 10; // 10 if page loads but game doesn't
}

// Detection logic:
async function detectGameLoadFailure(page: any, logs: ConsoleMessage[]): Promise<GameLoadError | null> {
  // Check for missing game assets
  const missingAssets = logs.filter(log => 
    log.type === 'error' && log.text.includes('404') && 
    (log.text.includes('.js') || log.text.includes('.wasm') || log.text.includes('.data'))
  );
  
  if (missingAssets.length > 0) {
    return {
      category: 'game_load_failed',
      subcategory: 'missing_assets',
      recoverable: false,
      playabilityScore: 10,
      evidence: missingAssets.map(log => log.text)
    };
  }
  
  // Check for JavaScript errors that prevent game initialization
  const criticalJSErrors = logs.filter(log =>
    log.type === 'error' && (
      log.text.includes('ReferenceError') || 
      log.text.includes('TypeError') ||
      log.text.includes('is not defined')
    )
  );
  
  if (criticalJSErrors.length > 2) { // Multiple JS errors likely indicate broken game
    return {
      category: 'game_load_failed', 
      subcategory: 'js_error',
      recoverable: false,
      playabilityScore: 10,
      evidence: criticalJSErrors.map(log => log.text)
    };
  }
  
  return null;
}
```

#### 3. Interaction Failures
```typescript
interface InteractionError {
  category: 'interaction_failed';
  subcategory: 'no_start_button' | 'unresponsive_controls' | 'ui_missing' | 'requires_user_gesture';
  recoverable: boolean;
  playabilityScore: number; // 20-50 depending on severity
}

// Common interaction failure patterns:
const INTERACTION_FAILURE_PATTERNS = {
  no_start_button: {
    detection: async (page: any) => {
      const startButtons = await page.$$('button, [class*="start"], [class*="play"]');
      return startButtons.length === 0;
    },
    message: 'No start/play button found',
    score: 30,
    recoverable: true // Can try center-click fallback
  },
  
  requires_user_gesture: {
    detection: (logs: ConsoleMessage[]) => {
      return logs.some(log => 
        log.text.includes('user gesture') || 
        log.text.includes('click to start') ||
        log.text.includes('autoplay policy')
      );
    },
    message: 'Game requires user interaction to start (browser policy)',
    score: 50, // Game works, just needs interaction
    recoverable: true
  },
  
  unresponsive_controls: {
    detection: async (interactions: InteractionResult[]) => {
      const attempts = interactions.filter(i => i.type === 'click' || i.type === 'keyboard');
      const successful = attempts.filter(i => i.success);
      return attempts.length > 3 && successful.length === 0;
    },
    message: 'Game does not respond to clicks or keyboard input',
    score: 20,
    recoverable: false
  }
};
```

#### 4. Browser/Automation Detection
```typescript
interface AutomationBlockedError {
  category: 'automation_detected';
  subcategory: 'bot_detection' | 'captcha' | 'login_required' | 'geo_blocked';
  recoverable: boolean;
  playabilityScore: 0;
}

// Detection patterns:
async function detectAutomationBlocking(page: any): Promise<AutomationBlockedError | null> {
  const content = await page.content();
  const text = content.toLowerCase();
  
  // Bot detection services
  if (text.includes('blocked') && (text.includes('bot') || text.includes('automated'))) {
    return {
      category: 'automation_detected',
      subcategory: 'bot_detection', 
      recoverable: false,
      playabilityScore: 0,
      message: 'Site detected automated access and blocked the request'
    };
  }
  
  // CAPTCHA requirements
  if (text.includes('captcha') || text.includes('prove you are human')) {
    return {
      category: 'automation_detected',
      subcategory: 'captcha',
      recoverable: false, 
      playabilityScore: 0,
      message: 'Site requires CAPTCHA verification'
    };
  }
  
  // Login walls
  if (text.includes('sign in') || text.includes('login required')) {
    return {
      category: 'automation_detected',
      subcategory: 'login_required',
      recoverable: false,
      playabilityScore: 0,
      message: 'Site requires user authentication'
    };
  }
  
  return null;
}
```

#### 5. Unsupported Game Types
```typescript
interface UnsupportedGameError {
  category: 'unsupported_game_type';
  detectedType: 'flash' | 'unity_webplayer' | 'java_applet' | 'silverlight' | 'native_app';
  message: string;
  playabilityScore: 0;
}

// Detection logic:
async function detectUnsupportedGameType(page: any): Promise<UnsupportedGameError | null> {
  const plugins = await page.evaluate(() => {
    return {
      hasFlash: navigator.plugins['Shockwave Flash'] !== undefined,
      hasUnityWebPlayer: navigator.plugins['Unity Player'] !== undefined,
      hasJava: navigator.javaEnabled && navigator.javaEnabled(),
      hasSilverlight: navigator.plugins['Silverlight'] !== undefined
    };
  });
  
  const content = await page.content().toLowerCase();
  
  // Flash detection
  if (content.includes('adobe flash') || content.includes('swf') || plugins.hasFlash) {
    return {
      category: 'unsupported_game_type',
      detectedType: 'flash',
      message: 'Game requires Adobe Flash, which is no longer supported',
      playabilityScore: 0
    };
  }
  
  // Unity WebPlayer (deprecated)
  if (content.includes('unity web player') || plugins.hasUnityWebPlayer) {
    return {
      category: 'unsupported_game_type', 
      detectedType: 'unity_webplayer',
      message: 'Game uses deprecated Unity Web Player',
      playabilityScore: 0
    };
  }
  
  return null;
}
```

### Error Recovery Strategies

```typescript
class ErrorRecoveryManager {
  async attemptRecovery(error: GameError, context: TestContext): Promise<boolean> {
    switch (error.category) {
      case 'interaction_failed':
        return await this.recoverFromInteractionFailure(error, context);
        
      case 'game_load_failed':
        if (error.subcategory === 'missing_assets') {
          return await this.waitForDelayedAssets(context);
        }
        break;
        
      case 'automation_detected':
        // No recovery possible for most automation detection
        return false;
        
      default:
        return false;
    }
  }
  
  private async recoverFromInteractionFailure(error: InteractionError, context: TestContext): Promise<boolean> {
    if (error.subcategory === 'no_start_button') {
      // Try clicking center of screen as fallback
      try {
        await context.page.click('body', { position: { x: 400, y: 300 } });
        await context.page.waitForTimeout(2000);
        return true;
      } catch {
        return false;
      }
    }
    
    if (error.subcategory === 'requires_user_gesture') {
      // Try clicking anywhere to satisfy user gesture requirement
      try {
        await context.page.click('body');
        await context.page.waitForTimeout(1000);
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }
  
  private async waitForDelayedAssets(context: TestContext): Promise<boolean> {
    // Some games load assets progressively
    await context.page.waitForTimeout(10000); // Wait 10 more seconds
    
    // Check if game elements appeared
    const gameElements = await context.page.$$('canvas, [class*="game"], [id*="game"]');
    return gameElements.length > 0;
  }
}
```

### Error-to-Playability Score Mapping

```typescript
// Consistent scoring based on error categories
function calculatePlayabilityScore(errors: GameError[], interactions: InteractionResult[]): number {
  // Start with perfect score
  let score = 100;
  
  // Deduct points for each error category
  for (const error of errors) {
    switch (error.category) {
      case 'page_load_failed':
      case 'unsupported_game_type':
      case 'automation_detected':
        return 0; // Complete failure
        
      case 'game_load_failed':
        score -= 70; // Major issue but page loads
        break;
        
      case 'interaction_failed':
        if (error.subcategory === 'requires_user_gesture') {
          score -= 10; // Minor issue - game works with interaction
        } else if (error.subcategory === 'unresponsive_controls') {
          score -= 60; // Major usability issue
        } else {
          score -= 30; // Moderate issue
        }
        break;
        
      case 'technical_issues':
        score -= 20; // Console errors but game might work
        break;
    }
  }
  
  // Bonus points for successful interactions
  const successfulInteractions = interactions.filter(i => i.success).length;
  score += Math.min(successfulInteractions * 5, 20); // Up to 20 bonus points
  
  return Math.max(0, Math.min(100, score));
}
```

---

## Granular Implementation Task List

**Purpose**: Break down development into 1-4 hour implementable chunks with clear acceptance criteria.

**Notation**: 
- 🔗 = Has dependencies (wait for prerequisite tasks)
- ⚠️ = Critical path item (blocks other tasks)
- 🧪 = Includes verification/testing step

## Detailed Task Breakdown

### Phase 0: Setup Tasks

| Task | Complexity | Dependencies | Output |
|------|----------|--------------|--------|
| Run `npx create-browser-app` | Low | None | Project scaffold |
| Obtain Browserbase API keys | Low | Browserbase account | `.env` populated |
| Obtain Anthropic API keys | Low | Anthropic account | `.env` populated |
| Configure AWS credentials | Low | AWS account | `~/.aws/credentials` |
| Create S3 bucket | Low | AWS access | `dreamup-qa-results` bucket |
| Test basic Stagehand script | Medium | All above | Verified setup |

### Phase 1: MVP Tasks

| Task | Complexity | File | Notes |
|------|----------|------|-------|
| Create project structure | Medium | `src/` folders | Organize by concern |
| Implement game loader | Medium | `browser/loader.ts` | Stagehand init + navigate |
| Implement screenshot capture | Medium | `capture/screenshot.ts` | Buffer to file |
| Simple heuristic evaluator | Medium | `eval/simple.ts` | No LLM, basic checks |
| CLI interface | Medium | `qa-agent.ts` | Parse args, run pipeline |
| Error handling basics | Medium | All files | Try-catch, timeouts |

### Phase 2: LLM Integration Tasks

| Task | Complexity | File | Notes |
|------|----------|------|-------|
| Install AI SDK dependencies | Low | `package.json` | npm install |
| Create Zod schemas | Medium | `schemas/report.ts` | Type-safe outputs |
| LLM evaluator implementation | High | `llm/evaluator.ts` | Vision + structured output |
| Prompt engineering | Medium | `llm/prompts.ts` | Iterate on quality |
| Find start button logic | Medium | `browser/interactions.ts` | Stagehand `act()` |
| Simulate gameplay | Medium | `browser/interactions.ts` | Keyboard/mouse inputs |
| Multi-screenshot orchestration | Medium | `qa-agent.ts` | Timing logic |
| Retry & timeout logic | Medium | `utils/retry.ts` | Exponential backoff |

### Phase 3: S3 & Testing Tasks

| Task | Complexity | File | Notes |
|------|----------|------|-------|
| S3 client setup | Medium | `storage/s3-client.ts` | AWS SDK v3 |
| Upload functions | Medium | `storage/s3-client.ts` | Screenshots, logs, JSON |
| Presigned URL generation | Medium | `storage/s3-client.ts` | Expire in 24h |
| Console log capture | Medium | `capture/console-logs.ts` | Playwright CDP |
| Test game 1 (puzzle) | Medium | `test-results/` | Document findings |
| Test game 2 (platformer) | Medium | `test-results/` | Document findings |
| Test game 3 (clicker) | Medium | `test-results/` | Document findings |
| Prompt tuning from tests | High | `llm/prompts.ts` | Improve accuracy |

### Phase 4: Polish Tasks

| Task | Complexity | File | Notes |
|------|----------|------|-------|
| Add JSDoc comments | Medium | All `.ts` files | Document public APIs |
| Write README | High | `README.md` | Setup, usage, examples |
| Architecture docs | Medium | `docs/ARCHITECTURE.md` | System design |
| Lambda handler | Medium | `handler.ts` | Lambda entry point |
| Lambda deployment guide | Medium | `docs/LAMBDA_DEPLOY.md` | Step-by-step |
| Code cleanup & refactor | High | All files | Remove duplication |
| Record demo video | Medium | N/A | Screen recording |

---

## Granular Implementation Tasks

*Breaking down development into 1-4 hour implementable chunks with clear acceptance criteria.*

**Notation**: 
- 🔗 = Has dependencies (wait for prerequisite tasks)
- ⚠️ = Critical path item (blocks other tasks)  
- 🧪 = Includes verification/testing step

### 📋 **Phase 0: Environment Setup (Day 1)**

#### **0.1** ⚠️ **Project Initialization** (1-2 hours)
```bash
# Task: Set up base project structure
npx create-browser-app dreamup-qa-pipeline
cd dreamup-qa-pipeline
```
**Acceptance Criteria:**
- [ ] Project directory created
- [ ] Base dependencies installed (`npm install` works)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Example script runs successfully

**Verification:** `npm run dev` shows browser session starting

---

#### **0.2** ⚠️ **API Keys & Environment** (1 hour)
🔗 **Dependencies:** 0.1

**Tasks:**
1. Create `.env` file with all required variables
2. Test each API key individually
3. Run verification script from PRD Step 8

**Acceptance Criteria:**
- [ ] `.env` file contains: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `ANTHROPIC_API_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
- [ ] All API verification tests pass (see PRD Step 8)
- [ ] S3 bucket exists and is accessible

**Verification:** Run `node test-integration.js` - all tests show ✅ PASS

---

#### **0.3** **Project Structure Setup** (1 hour)  
🔗 **Dependencies:** 0.1, 0.2

**Create directory structure:**
```
src/
├── browser/           # Browser automation logic
├── capture/           # Screenshot and logging
├── llm/               # AI evaluation 
├── storage/           # S3 operations
├── schemas/           # Zod type definitions
├── utils/             # Shared utilities
└── qa-agent.ts        # Main orchestrator
```

**Acceptance Criteria:**
- [ ] All directories created
- [ ] Each directory has index.ts file with basic export
- [ ] TypeScript can import from each module
- [ ] No circular dependencies

**Verification:** `npm run build` compiles successfully

---

### 📋 **Phase 1: Core MVP (Days 2-3)**

#### **1.1** ⚠️ **Basic Type Definitions** (1 hour)
🔗 **Dependencies:** 0.3

**File:** `src/schemas/types.ts`
```typescript
// Create basic interfaces (before Zod schemas)
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
```

**Acceptance Criteria:**
- [ ] All interfaces compile in TypeScript
- [ ] Types are importable from other files
- [ ] No syntax errors

---

#### **1.2** ⚠️ **Environment Configuration** (1 hour)
🔗 **Dependencies:** 1.1

**File:** `src/utils/config.ts`
```typescript
export class Config {
  static load(): QAConfig {
    return {
      maxTestDuration: parseInt(process.env.MAX_TEST_DURATION || '270000'),
      screenshotDebounce: parseInt(process.env.SCREENSHOT_DEBOUNCE || '500'),
      browserbaseTimeout: parseInt(process.env.BROWSERBASE_TIMEOUT || '60000'),
    };
  }
  
  static validate(): void {
    // Throw if required env vars missing
  }
}
```

**Acceptance Criteria:**
- [ ] Config loads from environment variables
- [ ] Provides sensible defaults
- [ ] Validation throws on missing required vars
- [ ] Can be imported and used

**Verification:** Create test file that loads config without errors

---

#### **1.3** **Basic S3 Client** (2 hours)
🔗 **Dependencies:** 1.1

**File:** `src/storage/s3-client.ts`
```typescript
export class S3Client {
  async uploadScreenshot(key: string, buffer: Buffer): Promise<string> {
    // Upload to S3, return URL
  }
  
  async generatePresignedUrl(key: string): Promise<string> {
    // Generate 24-hour presigned URL
  }
}
```

**Acceptance Criteria:**
- [ ] Can upload a test file to S3
- [ ] Returns valid presigned URL
- [ ] Handles upload errors gracefully
- [ ] Uses correct bucket and region

**Verification:** Upload test image, verify URL works in browser

---

#### **1.4** ⚠️ **Stagehand Browser Client** (2-3 hours)
🔗 **Dependencies:** 1.2

**File:** `src/browser/stagehand-client.ts`
```typescript
export class StagehandClient {
  async initialize(): Promise<void> {
    // Create Stagehand instance with config
  }
  
  async navigateToGame(url: string): Promise<void> {
    // Navigate and wait for load
  }
  
  async takeScreenshot(): Promise<Buffer> {
    // Capture screenshot as buffer
  }
  
  async close(): Promise<void> {
    // Clean up session
  }
}
```

**Acceptance Criteria:**
- [ ] Can initialize Stagehand with Browserbase
- [ ] Can navigate to test URL (e.g., example.com)
- [ ] Can capture screenshot
- [ ] Proper cleanup/session management
- [ ] Error handling for navigation failures

**Verification:** 🧪 Navigate to 3 different URLs, capture screenshots

---

#### **1.5** **Screenshot Manager with S3** (2 hours)
🔗 **Dependencies:** 1.3, 1.4

**File:** `src/capture/screenshot-manager.ts`
```typescript
export class ScreenshotManager {
  private lastScreenshotTime = 0;
  
  async takeDeboucedScreenshot(trigger: string): Promise<string | null> {
    // Check debounce timing
    // Take screenshot via Stagehand
    // Upload to S3 immediately
    // Return S3 URL
  }
}
```

**Acceptance Criteria:**
- [ ] Respects debounce timing (500ms default)
- [ ] Uploads immediately to S3 (no memory storage)
- [ ] Returns S3 URLs
- [ ] Handles S3 upload failures

**Verification:** 🧪 Rapid calls should be debounced, verify S3 uploads

---

#### **1.6** **Basic Game Loader** (2 hours)  
🔗 **Dependencies:** 1.4, 1.5

**File:** `src/browser/game-loader.ts`
```typescript
export class GameLoader {
  async loadGame(gameUrl: string): Promise<LoadResult> {
    // Navigate to URL
    // Wait for initial load
    // Take initial screenshot  
    // Return basic status
  }
}
```

**Acceptance Criteria:**
- [ ] Can load different game URLs
- [ ] Detects basic load success/failure
- [ ] Takes initial screenshot
- [ ] Handles timeout cases
- [ ] Returns structured result

**Verification:** 🧪 Test with 5 different game URLs

---

#### **1.7** **Simple Heuristic Evaluator** (1 hour)
🔗 **Dependencies:** 1.1

**File:** `src/eval/simple-evaluator.ts`
```typescript
export class SimpleEvaluator {
  evaluate(screenshots: Screenshot[], logs?: string): BasicQAResult {
    // Basic heuristics:
    // - Did page load? (screenshot not blank)
    // - Any console errors?
    // - Reasonable page content?
    return result;
  }
}
```

**Acceptance Criteria:**
- [ ] Returns pass/fail based on simple rules
- [ ] Checks for blank/error screenshots
- [ ] Basic console log analysis
- [ ] Provides reason for failure

**Verification:** Test with known good/bad game URLs

---

#### **1.8** ⚠️ **Basic CLI Interface** (2 hours)
🔗 **Dependencies:** 1.6, 1.7

**File:** `src/qa-agent.ts`
```typescript
export async function runQATest(gameUrl: string): Promise<BasicQAResult> {
  // Orchestrate: load game, capture screenshot, evaluate
}

// CLI handling
if (require.main === module) {
  const gameUrl = process.argv[2];
  runQATest(gameUrl).then(console.log);
}
```

**Package.json script:**
```json
{
  "scripts": {
    "qa": "ts-node src/qa-agent.ts"
  }
}
```

**Acceptance Criteria:**
- [ ] `npm run qa <url>` works from command line
- [ ] Returns JSON result
- [ ] Handles invalid URLs gracefully
- [ ] Shows progress/status during execution

**Verification:** 🧪 `npm run qa https://example.com` returns valid JSON

---

### 📋 **Phase 2: LLM Integration (Days 4-5)**

#### **2.1** **Zod Schemas for LLM** (1 hour)
🔗 **Dependencies:** 1.1

**File:** `src/schemas/report-schema.ts`
```typescript
export const QAReportSchema = z.object({
  status: z.enum(['pass', 'fail', 'error']),
  playabilityScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  // ... (use corrected schemas from PRD)
});
```

**Acceptance Criteria:**
- [ ] All schemas compile without errors
- [ ] Can parse valid JSON
- [ ] Rejects invalid JSON with clear errors
- [ ] Exports all required types

**Verification:** Test with valid/invalid JSON objects

---

#### **2.2** **Anthropic Client Setup** (1 hour)
🔗 **Dependencies:** 2.1

**File:** `src/llm/anthropic-client.ts`
```typescript
export class AnthropicClient {
  async evaluateScreenshots(screenshots: Screenshot[]): Promise<QAReport> {
    // Use Vercel AI SDK generateObject
    // Pass screenshots to Claude
    // Return validated result
  }
}
```

**Acceptance Criteria:**
- [ ] Can call Anthropic API successfully
- [ ] Handles multiple screenshots
- [ ] Returns validated Zod schema
- [ ] Proper error handling for API failures

**Verification:** 🧪 Test with 1-3 sample screenshots

---

#### **2.3** **Basic Game Interaction** (3 hours)
🔗 **Dependencies:** 1.4

**File:** `src/browser/game-interactor.ts`
```typescript
export class GameInteractor {
  async findAndClickStart(): Promise<InteractionResult> {
    // Try common start button selectors
    // Fall back to center-screen click
  }
  
  async attemptBasicInteraction(): Promise<InteractionResult[]> {
    // Try clicking, keyboard inputs
    // Return interaction results
  }
}
```

**Acceptance Criteria:**
- [ ] Attempts multiple start button strategies
- [ ] Records interaction success/failure
- [ ] Takes screenshots after interactions
- [ ] Handles interaction timeouts

**Verification:** 🧪 Test with puzzle game, platformer, clicker

---

#### **2.4** **LLM Prompt Engineering** (2 hours)
🔗 **Dependencies:** 2.2

**File:** `src/llm/prompts.ts`
```typescript
export class PromptBuilder {
  static buildEvaluationPrompt(screenshots: Screenshot[]): string {
    return `You are evaluating a browser game for playability...
    
    Analyze these ${screenshots.length} screenshots:
    - Screenshot 1: Initial game load
    - Screenshot 2: After attempting to start
    - Screenshot 3: After basic interactions
    
    Evaluate ONLY these criteria:
    1. Did the game load without errors? (0-25 points)
    2. Are UI elements visible and clickable? (0-25 points)  
    3. Did the game respond to interactions? (0-25 points)
    4. Overall user experience and polish? (0-25 points)
    
    Be conservative. If unsure, indicate low confidence.`;
  }
}
```

**Acceptance Criteria:**
- [ ] Clear, specific evaluation criteria
- [ ] Structured scoring system
- [ ] Conservative approach (avoids false positives)
- [ ] Handles variable screenshot counts

**Verification:** Test with known good/bad games, check consistency

---

#### **2.5** ⚠️ **Integration: Multi-Screenshot Pipeline** (2 hours)
🔗 **Dependencies:** 1.8, 2.2, 2.3

**Update:** `src/qa-agent.ts`
```typescript
export async function runQATest(gameUrl: string): Promise<QAReport> {
  // 1. Load game + screenshot
  // 2. Attempt interactions + screenshots  
  // 3. Wait and observe + final screenshot
  // 4. Send all screenshots to LLM
  // 5. Return full QA report
}
```

**Acceptance Criteria:**
- [ ] Captures 3-5 screenshots at key moments
- [ ] Includes LLM evaluation
- [ ] Returns full QAReport schema
- [ ] Handles LLM API failures gracefully

**Verification:** 🧪 End-to-end test with complete JSON output

---

#### **2.6** **Retry Logic & Error Handling** (2 hours)
🔗 **Dependencies:** 2.5

**File:** `src/utils/retry.ts`
```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  // Exponential backoff retry logic
}
```

**Apply to:** Navigation, screenshots, LLM calls, S3 uploads

**Acceptance Criteria:**
- [ ] Configurable retry counts
- [ ] Exponential backoff
- [ ] Preserves original error on final failure
- [ ] Applied to all external API calls

**Verification:** Test with intentionally failing operations

---

### 📋 **Phase 3: Production Features (Day 6)**

#### **3.1** **Console Log Capture** (2 hours)
🔗 **Dependencies:** 1.4

**File:** `src/capture/console-capture.ts`
```typescript
export class ConsoleCapture {
  startCapturing(): void {
    // Listen to page console events
  }
  
  async generateReport(): Promise<string> {
    // Filter and categorize logs
    // Upload to S3
    // Return S3 URL
  }
}
```

**Acceptance Criteria:**
- [ ] Captures console logs, errors, warnings
- [ ] Filters for game-relevant content
- [ ] Uploads log report to S3
- [ ] Returns S3 URL for inclusion in QA report

**Verification:** 🧪 Test with game that has console errors

---

#### **3.2** **Comprehensive Game Testing** (3 hours)
🔗 **Dependencies:** 2.5, 3.1

**Task:** Test with 5+ diverse games and document results

**Games to Test:**
1. Simple puzzle (Tic-tac-toe)
2. Platformer with keyboard controls  
3. Clicker/idle game
4. Broken game (intentionally)
5. Complex multi-screen game

**Acceptance Criteria:**
- [ ] Each game tested end-to-end
- [ ] Results documented in `test-results/`
- [ ] Screenshots and logs accessible via S3 URLs
- [ ] Accuracy assessment vs manual evaluation

**Verification:** All test results match expected outcomes

---

#### **3.3** **S3 Enhancement & Cleanup** (1 hour)  
🔗 **Dependencies:** 3.1, 3.2

**Enhancements:**
- Organized folder structure: `{gameId}/{timestamp}/`
- Presigned URL generation with 24h expiry
- Error handling for upload failures
- Cleanup of temp files

**Acceptance Criteria:**
- [ ] S3 objects organized by game and timestamp
- [ ] All URLs in reports are accessible
- [ ] No temp files left on local system
- [ ] Upload retry logic works

---

### 📋 **Phase 4: Polish & Deployment (Day 7)**

#### **4.1** **Lambda Handler** (1 hour)
🔗 **Dependencies:** 3.2

**File:** `handler.ts`
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { runQATest } from './src/qa-agent';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { gameUrl } = JSON.parse(event.body || '{}');
  const result = await runQATest(gameUrl);
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
```

**Acceptance Criteria:**
- [ ] Handles API Gateway events
- [ ] Parses gameUrl from request body
- [ ] Returns proper HTTP responses
- [ ] Error handling for malformed requests

**Verification:** Test locally with `lambda-local`

---

#### **4.2** **Documentation** (2 hours)
🔗 **Dependencies:** 4.1

**Files to Create:**
- `README.md` - Setup and usage
- `docs/ARCHITECTURE.md` - System design 
- `docs/DEPLOYMENT.md` - Lambda deployment guide

**Acceptance Criteria:**
- [ ] README has clear setup instructions
- [ ] Architecture doc explains system design
- [ ] Deployment guide is step-by-step
- [ ] All code examples work

---

#### **4.3** **Final Testing & Demo** (2 hours)
🔗 **Dependencies:** 4.1, 4.2

**Tasks:**
1. Final end-to-end testing
2. Deploy to Lambda and test
3. Record 2-3 minute demo video
4. Create deployment package

**Acceptance Criteria:**
- [ ] All tests pass locally and on Lambda
- [ ] Demo video shows complete workflow
- [ ] Deployment package ready
- [ ] All documentation complete

---

## 🎯 **Success Metrics**

**Daily Checkpoints:**
- **Day 1:** Basic setup complete, APIs verified
- **Day 2-3:** MVP works end-to-end with simple evaluation
- **Day 4-5:** LLM integration complete, structured outputs
- **Day 6:** Production features, comprehensive testing
- **Day 7:** Deploy-ready with documentation

**Verification Commands:**
```bash
# Phase 1 checkpoint
npm run qa https://example.com

# Phase 2 checkpoint  
npm run qa https://playtictactoe.org

# Phase 3 checkpoint
npm run qa https://itch.io/games/html5  # Multiple games

# Phase 4 checkpoint
serverless deploy && curl -X POST [lambda-url]
```

---

## Risks to Mitigate

### 1. Stagehand Version Conflicts

**Risk:** Template uses Stagehand v2.0, but npm might install incompatible versions.

**Impact:** Medium  
**Likelihood:** Low  

**Mitigation:**
- Pin exact versions in `package.json`
- Use `package-lock.json` for reproducibility
- Test immediately after `npm install`
- Check Stagehand GitHub for breaking changes

**Action Items:**
```json
{
  "dependencies": {
    "@browserbasehq/stagehand": "^2.0.0"  // Use caret for minor updates
  }
}
```

### 2. LLM Integration Strategy: Stagehand vs Vercel AI SDK

**Decision**: Use **clean separation** - Stagehand for browser automation, Vercel AI SDK for structured LLM evaluation.

**Rationale:**
- **Stagehand**: Excellent for browser automation, DOM interaction, navigation
- **Vercel AI SDK**: Superior structured outputs (Zod schemas), more mature LLM integration
- **Separation of concerns**: Browser actions ≠ evaluation logic

**Implementation:**
```typescript
// Phase 1: Browser automation with Stagehand
class GameTester {
  private stagehand: Stagehand;
  
  async navigateAndInteract(gameUrl: string): Promise<Screenshot[]> {
    await this.stagehand.goto(gameUrl);
    
    // Use Stagehand for all browser operations
    await this.stagehand.act({ action: "click", coordinate: [400, 300] });
    await this.stagehand.observe({ instruction: "Find start button" });
    
    // Capture screenshots using Stagehand's page access
    const screenshots = [];
    screenshots.push(await this.stagehand.page.screenshot());
    
    return screenshots;
  }
}

// Phase 2: LLM evaluation with Vercel AI SDK  
class GameEvaluator {
  async evaluateScreenshots(screenshots: Screenshot[]): Promise<QAReport> {
    // Use Vercel AI SDK for structured evaluation
    const evaluation = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: QAReportSchema, // Zod schema for type safety
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Evaluate this game for playability...' },
            ...screenshots.map(img => ({ type: 'image', image: img }))
          ]
        }
      ]
    });
    
    return evaluation.object;
  }
}

// Phase 3: Clean orchestration
class QAAgent {
  private tester = new GameTester();
  private evaluator = new GameEvaluator();
  
  async runQATest(gameUrl: string): Promise<QAReport> {
    const screenshots = await this.tester.navigateAndInteract(gameUrl);
    const report = await this.evaluator.evaluateScreenshots(screenshots);
    return report;
  }
}
```

**Benefits of This Approach:**
- ✅ **Best of both tools**: Stagehand's browser expertise + AI SDK's LLM maturity
- ✅ **Type safety**: Zod schemas for all LLM outputs
- ✅ **Maintainable**: Clear boundaries, easy to debug
- ✅ **Testable**: Can mock browser or LLM components independently

**What NOT to do:**
- ❌ Don't use Stagehand's `extract({ useVision: true })` for evaluation
- ❌ Don't try to use Vercel AI SDK for browser automation
- ❌ Don't mix LLM calls across both systems

**Configuration:**
```typescript
// Stagehand config (browser automation only)
const stagehandConfig = {
  env: 'BROWSERBASE',
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  // Don't configure LLM settings here
};

// Vercel AI SDK config (LLM evaluation only)
const anthropicClient = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### 3. Lambda Timeout & Memory Limits

**Risk:** Game tests take >5 minutes or use >512MB RAM, hitting Lambda limits.

**Impact:** High  
**Likelihood:** Medium

**Mitigation:**
- Set Lambda timeout to 5 minutes (max for game test)
- Use Browserbase (cloud browser) so browser memory doesn't count against Lambda
- Implement aggressive timeouts in code (max 4:30 to leave buffer)
- Use Lambda memory: 512MB (should be enough since browser runs remotely)
- For longer tests, use Step Functions or ECS

**Configuration:**
```javascript
// Lambda config
{
  timeout: 300,  // 5 minutes
  memorySize: 512  // MB
}

// Code timeout
const MAX_TEST_DURATION = 270000; // 4.5 minutes in ms
```

### 4. S3 Upload Failures

**Risk:** Screenshots fail to upload, losing evidence.

**Impact:** Medium  
**Likelihood:** Low

**Mitigation:**
- Implement retry logic (3 attempts with exponential backoff)
- Save to local temp directory first as backup
- Use multipart upload for files >5MB
- Validate upload with `HeadObject` call
- Return presigned URLs in report for verification

**Code Pattern:**
```typescript
async function uploadWithRetry(buffer: Buffer, key: string, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      await s3Client.send(new PutObjectCommand({ /* ... */ }));
      return; // Success
    } catch (error) {
      if (i === attempts - 1) throw error;
      await sleep(2 ** i * 1000); // Exponential backoff
    }
  }
}
```

### 5. LLM Inconsistent Results

**Risk:** Claude gives different playability scores for the same game on different runs.

**Impact:** Medium  
**Likelihood:** High

**Mitigation:**
- Use structured outputs (Zod schema) to enforce format
- Add `confidence` field to report (0-1 scale)
- Set temperature to 0 for deterministic results
- Use detailed, specific prompts
- Include multiple screenshots for context
- Add fallback heuristics if confidence < 0.6

**Prompt Strategy:**
```typescript
const prompt = `You are evaluating a browser game for playability.

Analyze these screenshots and console logs:
- Screenshot 1: Initial load
- Screenshot 2: Mid-gameplay  
- Screenshot 3: After 30 seconds

Evaluate ONLY these specific criteria:
1. Did the game load without errors? (yes/no)
2. Are UI elements visible and clickable? (yes/no)
3. Did the game crash or freeze? (yes/no)

Be conservative. If unsure, indicate low confidence.`;
```

### 6. Games Don't Load in Headless Mode

**Risk:** Some games detect headless browsers and refuse to load.

**Impact:** High  
**Likelihood:** Low

**Mitigation:**
- Browserbase runs full Chrome (not headless), so most games work
- For problem games, Browserbase can emulate user agent
- Test with `headed` mode locally first to verify game works
- Screenshot comparison can detect blank pages
- Flag games that fail with specific error in report

**Detection Logic:**
```typescript
// Check if game actually loaded
const hasContent = await page.evaluate(() => {
  return document.body.innerText.length > 100;
});

if (!hasContent) {
  return { status: 'fail', reason: 'Game failed to load content' };
}
```

### 7. Scope Creep

**Risk:** Feature requests expand beyond 5-day timeline.

**Impact:** High  
**Likelihood:** Medium

**Mitigation:**
- **Strict adherence to phase gates** - No Phase 3 until Phase 2 works
- Mark all nice-to-have features as Phase 5 (stretch)
- Timebox each task (use estimates above)
- Get stakeholder approval before adding features
- Remember: Prototype > Perfect

**Decision Framework:**
- Is it required for core functionality? → Do it now
- Is it in the spec document? → Phase 1-4
- Would it be nice to have? → Phase 5 only
- Does the user love it without it? → Skip

### 8. API Cost Overruns

**Risk:** Development iteration costs exceed budget due to LLM/Browserbase usage.

**Impact:** Low  
**Likelihood:** Low

**Mitigation:**
- Use Browserbase free tier (60 minutes included)
- Cache LLM responses during development (save to local `.cache/` directory)
- Use cheaper models for iteration (GPT-4o-mini) then upgrade to Claude for final
- Set up billing alerts in AWS/Anthropic dashboards
- Mock LLM responses in unit tests

**Cost Estimates (Low Volume - MVP Focus):**
- Browserbase: Free tier covers ~60 minutes (sufficient for development + initial testing)
- Claude 3.5 Sonnet: ~$0.08 per game test (3 screenshots @ ~$0.027 each)
- S3: <$0.01 per month for test data
- **Development cost**: <$5 total for MVP development phase

**Development Tip:**
```typescript
// Use caching during dev
const CACHE_DIR = '.cache/llm-responses';
const cacheKey = createHash('md5').update(screenshot).digest('hex');
const cachedPath = path.join(CACHE_DIR, `${cacheKey}.json`);

if (fs.existsSync(cachedPath)) {
  return JSON.parse(fs.readFileSync(cachedPath, 'utf-8'));
}
```

### 9. Browser Session Limit

**Risk:** Browserbase limits concurrent sessions on free tier.

**Impact:** Low  
**Likelihood:** Low

**Mitigation:**
- Free tier allows 1 concurrent session (sufficient for development)
- Tests are sequential, not parallel (no concurrency needed)
- Properly close sessions with `stagehand.close()`
- Implement session cleanup in finally blocks
- Upgrade to paid tier only if batch testing is needed

### 10. Complex Game Interactions

**Risk:** Some games have complex multi-step interactions that are hard to automate.

**Impact:** Medium  
**Likelihood:** Medium

**Mitigation:**
- Start with simple games (puzzle, clicker) to build confidence
- Use Stagehand's `agent()` mode for multi-step tasks
- For MVP, it's OK if complex games get lower playability scores
- Document known limitations in README
- Phase 5: Add game-specific strategies

**Out of Scope for MVP:**
- Multi-level RPGs
- Games requiring complex problem-solving
- Multiplayer games
- Games with CAPTCHA

### 11. User Interaction Requirements

**Risk:** Modern browsers require user interaction before playing audio/video or starting certain game features (click-to-play policies).

**Impact:** High  
**Likelihood:** High

**Mitigation:**
- Always attempt initial click/tap on game area after load
- Look for "Click to Start" or "Press any key" messages in screenshots
- Add interaction detection to LLM evaluation prompts
- Flag games requiring interaction but provide workaround attempts

**Detection Pattern:**
```typescript
// Check for common interaction requirement indicators
const requiresInteraction = await page.evaluate(() => {
  const text = document.body.innerText.toLowerCase();
  return text.includes('click to start') || 
         text.includes('press any key') || 
         text.includes('click to play');
});
```

### 12. Cookie Consent & Age Verification

**Risk:** Games on certain platforms show cookie consent dialogs or age verification screens that block access.

**Impact:** Medium  
**Likelihood:** Medium

**Mitigation:**
- Add consent dialog detection via DOM selectors
- Auto-accept common consent patterns (GDPR, CCPA)
- Screenshot consent screens for LLM analysis
- Implement retry logic after consent handling

**Common Patterns:**
```typescript
const consentSelectors = [
  '[data-testid="consent-accept"]',
  '.cookie-accept', 
  '#accept-cookies',
  'button:contains("Accept")',
  'button:contains("I Agree")'
];
```

### 13. Automation Detection

**Risk:** Some games detect headless browsers or automation tools and refuse to load or display "bot detected" messages.

**Impact:** Medium  
**Likelihood:** Low (Browserbase uses real Chrome, not headless)

**Mitigation:**
- Browserbase runs full Chrome instances (not headless detection)
- Add user agent rotation if needed
- Monitor for "bot detected" messages in screenshots
- Implement stealth mode settings for problematic games
- Flag detected automation in reports

**Detection Logic:**
```typescript
const botDetected = await page.evaluate(() => {
  const text = document.body.innerText.toLowerCase();
  return text.includes('bot detected') || 
         text.includes('automated traffic') ||
         text.includes('please prove you are human');
});
```

### 14. Game Scope Limitation (HTML5/WebGL Focus)

**Risk:** Non-HTML5/WebGL games (Flash, Unity WebPlayer, native apps) won't work with browser automation.

**Impact:** Low  
**Likelihood:** Low (most modern browser games use HTML5/WebGL)

**Mitigation:**
- Clearly scope testing to HTML5/WebGL games only
- Add technology detection to identify game engine
- Report "unsupported game type" for non-HTML5 games
- Focus on itch.io, Newgrounds, and similar HTML5 platforms

**Technology Detection:**
```typescript
const gameEngine = await page.evaluate(() => {
  if (window.UnityLoader || window.gameInstance) return 'unity-webgl';
  if (document.querySelector('canvas')) return 'html5-canvas';
  if (window.WebGLRenderingContext) return 'webgl';
  if (document.querySelector('embed[type*="flash"]')) return 'flash';
  return 'unknown';
});
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v20 or v22
- **npm** latest
- **Git** for version control
- **macOS** (or Linux/Windows with adjustments)

### Step 1: Create Project from Template

```bash
# Run the interactive setup
npx create-browser-app

# When prompted:
# - Project name: dreamup-qa-pipeline
# - Select AI model: Claude (Anthropic)
# - Enter Anthropic API key: [your key]
# - Using Cursor or Windsurf?: [your choice]
# - Run locally or Browserbase?: Browserbase (we'll toggle this later)

cd dreamup-qa-pipeline
```

### Step 2: Obtain API Keys

#### Browserbase
1. Go to https://browserbase.com
2. Sign up (free tier includes 60 minutes)
3. Create a project
4. Copy API Key and Project ID

#### Anthropic
1. Go to https://console.anthropic.com
2. Create API key (you should already have this)

#### AWS
1. Install AWS CLI if not already: `brew install awscli`
2. Run `aws configure`
3. Enter credentials (Access Key ID, Secret Access Key, region: `us-east-1`)

### Step 3: Configure Environment Variables

```bash
# The template creates .env for you, edit it:
nano .env
```

Add these variables:

```bash
# Browserbase
BROWSERBASE_API_KEY=bb_live_xxxxxxxxxxxxx
BROWSERBASE_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# AWS (optional if using ~/.aws/credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx

# S3
S3_BUCKET_NAME=dreamup-qa-results

# Config
MAX_TEST_DURATION=270000  # 4.5 minutes in milliseconds
MAX_RETRIES=3
```

### Step 4: Create S3 Bucket

```bash
# Create the bucket
aws s3 mb s3://dreamup-qa-results --region us-east-1

# Set lifecycle policy (optional - auto-delete old results after 30 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket dreamup-qa-results \
  --lifecycle-configuration file://lifecycle.json
```

`lifecycle.json`:
```json
{
  "Rules": [{
    "Id": "DeleteOldQAResults",
    "Status": "Enabled",
    "Prefix": "",
    "Expiration": { "Days": 30 }
  }]
}
```

### Step 5: Install Additional Dependencies

```bash
npm install @ai-sdk/anthropic ai @aws-sdk/client-s3 zod dotenv
```

### Step 6: Configure Stagehand for Local Testing

Edit `stagehand.config.ts`:

```typescript
import { StagehandConfig } from '@browserbasehq/stagehand';

export const stagehandConfig: StagehandConfig = {
  env: 'BROWSERBASE',  // Start with Browserbase (works locally!)
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  // Note: Check Stagehand docs for required config options
  // Some versions may require modelName, others may not
  // Verify during Step 8 API verification
};
```

### Step 7: Verify Setup & API Integration

Run the example script that comes with the template:

```bash
npm run dev  # or npm start
```

You should see:
- Browser session starts in Browserbase
- Navigates to a test URL
- Completes successfully

### Step 8: API Version & Integration Verification

**Critical: Run these verification steps before implementing to catch version mismatches early.**

#### A. Verify Stagehand API Compatibility

```bash
# Check installed version
npm list @browserbasehq/stagehand

# Test basic Stagehand functionality
node -e "
const { Stagehand } = require('@browserbasehq/stagehand');
console.log('Stagehand version:', require('@browserbasehq/stagehand/package.json').version);

// Test basic initialization (should not error)
try {
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID
  });
  console.log('✅ Stagehand initialization: PASS');
} catch (e) {
  console.log('❌ Stagehand initialization: FAIL -', e.message);
}
"
```

#### B. Verify Vercel AI SDK Integration

```bash
# Check versions
npm list ai @ai-sdk/anthropic

# Test AI SDK with Anthropic
node -e "
const { anthropic } = require('@ai-sdk/anthropic');
const { generateObject } = require('ai');
const { z } = require('zod');

console.log('AI SDK version:', require('ai/package.json').version);

// Test schema validation
const testSchema = z.object({
  status: z.string(),
  score: z.number()
});

console.log('✅ Zod schema creation: PASS');

// Test Anthropic client initialization 
try {
  const client = anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
  });
  console.log('✅ Anthropic client creation: PASS');
} catch (e) {
  console.log('❌ Anthropic client creation: FAIL -', e.message);
}
"
```

#### C. Verify AWS S3 Integration

```bash
# Test AWS credentials and S3 access
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testS3() {
  try {
    const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    const response = await client.send(new ListBucketsCommand({}));
    console.log('✅ AWS S3 connection: PASS');
    
    // Check if our bucket exists
    const bucketExists = response.Buckets.some(b => b.Name === process.env.S3_BUCKET_NAME);
    console.log('Bucket exists:', bucketExists ? '✅ PASS' : '❌ Need to create bucket');
  } catch (e) {
    console.log('❌ AWS S3 connection: FAIL -', e.message);
  }
}
testS3();
"
```

#### D. Full Integration Test

Create `test-integration.js` for comprehensive testing:

```javascript
const { Stagehand } = require('@browserbasehq/stagehand');
const { anthropic } = require('@ai-sdk/anthropic');
const { generateObject } = require('ai');
const { S3Client } = require('@aws-sdk/client-s3');
const { z } = require('zod');

async function testFullIntegration() {
  console.log('🧪 Running full integration test...\n');
  
  // Test 1: Stagehand browser automation
  try {
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID
    });
    
    console.log('✅ Stagehand initialization: PASS');
    
    // Test basic navigation
    await stagehand.goto('https://example.com');
    console.log('✅ Browser navigation: PASS');
    
    await stagehand.close();
    console.log('✅ Browser cleanup: PASS\n');
    
  } catch (e) {
    console.log('❌ Stagehand test: FAIL -', e.message, '\n');
  }
  
  // Test 2: Anthropic LLM
  try {
    const client = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    const testSchema = z.object({
      message: z.string(),
      confidence: z.number()
    });
    
    const result = await generateObject({
      model: client('claude-3-5-sonnet-20241022'), // Verify this model ID works
      schema: testSchema,
      messages: [{ role: 'user', content: 'Say hello and give confidence 0.9' }]
    });
    
    console.log('✅ Anthropic LLM: PASS');
    console.log('✅ Structured output: PASS\n');
    
  } catch (e) {
    console.log('❌ Anthropic test: FAIL -', e.message, '\n');
  }
  
  // Test 3: S3 connection
  try {
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    // Basic connection test (no actual upload)
    console.log('✅ S3 client creation: PASS\n');
  } catch (e) {
    console.log('❌ S3 test: FAIL -', e.message, '\n');
  }
}

testFullIntegration().catch(console.error);
```

Run integration test:
```bash
node test-integration.js
```

**Expected Results**: All tests should show "PASS". Any "FAIL" indicates version incompatibility or configuration issues that must be resolved before development.

**Troubleshooting:**
- If you see "API key invalid" → Check `.env` file
- If browser doesn't start → Check Browserbase dashboard for quota  
- If TypeScript errors → Run `npm install` again
- If Anthropic fails → Verify API key has sufficient credits AND check model identifier is correct
- If S3 fails → Check AWS credentials and region configuration
- If model not found → Check Anthropic documentation for current model names (claude-3-5-sonnet-20241022 may change)

---

## Test Cases

### Game Selection Criteria

Choose games that represent diverse interaction patterns:

1. **Simple Puzzle** - Basic click interactions
2. **Platformer** - Keyboard controls, physics
3. **Idle/Clicker** - Minimal interaction, state persistence
4. **Broken Game** - Intentionally buggy (for failure detection)
5. **Complex Game** - Multiple levels/screens

### Recommended Test Games

#### 1. Simple Puzzle: Tic-Tac-Toe
- **URL:** https://playtictactoe.org/
- **Expected Behavior:** Load, click start, make moves, detect win/loss
- **Key Test:** Can agent find and click cells?
- **Expected Score:** 85-95 (very playable)

#### 2. Platformer: Simple Mario Clone
- **URL:** Search itch.io for "html5 platformer"
- **Expected Behavior:** Arrow keys move character, space to jump
- **Key Test:** Can agent detect keyboard controls?
- **Expected Score:** 70-85 (playable with caveats)

#### 3. Idle/Clicker: Cookie Clicker Style
- **URL:** Search itch.io for "html5 clicker"
- **Expected Behavior:** Click to increment counter
- **Key Test:** Does game respond to repeated clicks?
- **Expected Score:** 90-100 (very simple, very playable)

#### 4. Broken Game: Create Custom Test
- **Approach:** Take a working game and introduce bugs
- **Example Bugs:** Remove start button, infinite loading, JS errors
- **Expected Score:** 0-30 (should detect as broken)

#### 5. Complex Game: Phaser-based RPG
- **URL:** Search openprocessing.org for "rpg game"
- **Expected Behavior:** Multiple screens, inventory, combat
- **Key Test:** Can agent navigate past first screen?
- **Expected Score:** 40-60 (partial playability)

### Test Results Template

For each game tested, document:

```markdown
## Game: [Name]
- **URL:** [URL]
- **Type:** [Puzzle/Platformer/etc]
- **Test Date:** [Date]
- **Duration:** [seconds]

### Results
- **Status:** pass/fail
- **Playability Score:** [0-100]
- **Confidence:** [0-1]

### Screenshots
- [S3 URL 1]
- [S3 URL 2]
- [S3 URL 3]

### Issues Found
1. [Issue description]
2. [Issue description]

### Agent Behavior
- [What did the agent do?]
- [What worked well?]
- [What failed?]

### Manual Validation
- **Accuracy:** Did the playability score match manual assessment? (yes/no)
- **Notes:** [Any observations]
```

Save these reports in `test-results/` directory.

---

## Lambda Deployment Strategy

### Architecture

```
API Gateway (or Direct Invoke)
         ↓
   Lambda Function
         ↓
    Your Code (handler.ts)
    ├── Calls Browserbase API (cloud browser)
    ├── Calls Claude API (vision analysis)
    └── Uploads to S3 (artifacts)
```

**Key Insight:** No browser binaries in Lambda! Everything runs remotely via APIs.

### Handler Implementation

Create `handler.ts`:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { runQATest } from './src/qa-agent';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse input
    const body = JSON.parse(event.body || '{}');
    const gameUrl = body.gameUrl;

    if (!gameUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameUrl is required' }),
      };
    }

    // Run QA test (same code as CLI)
    const result = await runQATest(gameUrl);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('QA test failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'QA test failed', 
        message: error.message 
      }),
    };
  }
};
```

### Deployment Steps

#### Option 1: Webpack Bundling (Recommended)

**Why Webpack**: Optimizes bundle size, reduces cold start times, simplifies dependency management.

```bash
# 1. Install webpack and dependencies
npm install --save-dev webpack webpack-cli webpack-node-externals terser-webpack-plugin

# 2. Create webpack.config.js
cat > webpack.config.js << 'EOF'
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/handler.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [
    nodeExternals({
      // Bundle these dependencies (they need to be bundled for Lambda)
      allowlist: ['@browserbasehq/stagehand', '@ai-sdk/anthropic', 'ai', 'zod']
    })
  ],
  output: {
    filename: 'handler.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
EOF

# 3. Build bundle
npm run build # Uses webpack via package.json script

# 4. Install production dependencies in dist/
cd dist && npm install --production --no-package-lock

# 5. Create deployment package (much smaller now)
zip -r ../function.zip .

# 6. Deploy to Lambda
cd .. 
aws lambda create-function \
  --function-name dreamup-qa-pipeline \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{
    BROWSERBASE_API_KEY=$BROWSERBASE_API_KEY,
    BROWSERBASE_PROJECT_ID=$BROWSERBASE_PROJECT_ID,
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,
    S3_BUCKET_NAME=dreamup-qa-results
  }"
```

**Bundle Size Comparison:**
- Without webpack: ~50-100MB (full node_modules)
- With webpack: ~5-15MB (optimized bundle)

**Required package.json scripts:**
```json
{
  "scripts": {
    "build": "webpack",
    "build:dev": "webpack --mode development",
    "deploy": "npm run build && cd dist && zip -r ../function.zip ."
  }
}
```

#### Option 2: Manual Deployment (Fallback)

```bash
# 1. Build TypeScript
npm run build

# 2. Create deployment package
zip -r function.zip dist/ node_modules/ package.json

# 3. Create Lambda function
aws lambda create-function \
  --function-name dreamup-qa-pipeline \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler dist/handler.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{
    BROWSERBASE_API_KEY=$BROWSERBASE_API_KEY,
    BROWSERBASE_PROJECT_ID=$BROWSERBASE_PROJECT_ID,
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,
    S3_BUCKET_NAME=dreamup-qa-results
  }"

# 4. Test invocation
aws lambda invoke \
  --function-name dreamup-qa-pipeline \
  --payload '{"gameUrl":"https://playtictactoe.org"}' \
  response.json

cat response.json
```

#### Option 2: Serverless Framework (Recommended for Production)

Install Serverless:
```bash
npm install -g serverless
```

Create `serverless.yml`:

```yaml
service: dreamup-qa-pipeline

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  timeout: 300
  memorySize: 512
  environment:
    BROWSERBASE_API_KEY: ${env:BROWSERBASE_API_KEY}
    BROWSERBASE_PROJECT_ID: ${env:BROWSERBASE_PROJECT_ID}
    ANTHROPIC_API_KEY: ${env:ANTHROPIC_API_KEY}
    S3_BUCKET_NAME: dreamup-qa-results
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:PutObject
        - s3:GetObject
      Resource: "arn:aws:s3:::dreamup-qa-results/*"

functions:
  qa:
    handler: dist/handler.handler
    events:
      - http:
          path: qa
          method: post

plugins:
  - serverless-plugin-typescript
```

Deploy:
```bash
serverless deploy
```

Test:
```bash
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/qa \
  -H "Content-Type: application/json" \
  -d '{"gameUrl":"https://playtictactoe.org"}'
```

### IAM Role Requirements

Lambda needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::dreamup-qa-results/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Cost Estimates (Lambda + APIs)

Per test execution:
- Lambda: $0.0000004 (512MB, 5 min) = ~$0.00
- Browserbase: Included in free tier, or ~$0.10/session
- Claude: ~$0.10 (3 images @ ~$0.03 each)
- S3: <$0.001

**Total per test: ~$0.10-0.20**

**Low Volume Production Estimates:**
- **10 tests/day**: ~$25/month (well within free tiers)
- **50 tests/day**: ~$120/month  
- **100 tests/day**: ~$240/month

**Cost Optimization for Low Volume:**
- Browserbase free tier covers first 60 minutes monthly
- Cache LLM responses during development  
- No need for connection pooling infrastructure (adds complexity without benefit)

---

## Success Criteria

### Functional Requirements

- [x] **Core Functionality**
  - [ ] Successfully tests 3+ diverse browser games end-to-end
  - [ ] Generates structured JSON reports with all required fields
  - [ ] Handles common failure modes gracefully (crashes, slow loads, rendering issues)

- [x] **Accuracy**
  - [ ] 80%+ accuracy on playability assessment (validated manually against 5+ games)
  - [ ] Confidence scores correlate with accuracy (high confidence → high accuracy)
  - [ ] Multiple evaluation runs of same game show <10% score variance

- [x] **Reliability**
  - [ ] Completes 90%+ of tests without crashing
  - [ ] Graceful timeout handling (no hanging processes)
  - [ ] Retry logic prevents transient failures

### Technical Requirements

- [x] **Code Quality**
  - [ ] Clean, modular, well-documented codebase
  - [ ] TypeScript with strict type checking
  - [ ] No hardcoded credentials (uses environment variables)
  - [ ] Proper error handling throughout

- [x] **Integration**
  - [ ] Works identically in local and Lambda environments
  - [ ] All artifacts uploaded to S3 successfully
  - [ ] Presigned URLs work for 24 hours

- [x] **Documentation**
  - [ ] README explains setup in <5 minutes
  - [ ] Architecture documented
  - [ ] Lambda deployment guide included
  - [ ] 2-5 minute demo video showing end-to-end flow

### Performance Requirements

- [ ] Test completion time: <5 minutes per game (including LLM analysis)
- [ ] Screenshot capture: <3 seconds per screenshot
- [ ] S3 upload: <5 seconds for all artifacts
- [ ] Total cost per test: <$0.25

### Deliverables Checklist

- [ ] GitHub repository with all source code
- [ ] Working CLI: `npm run qa <game-url>`
- [ ] Lambda handler implementation
- [ ] README.md with setup instructions
- [ ] docs/ARCHITECTURE.md
- [ ] docs/LAMBDA_DEPLOY.md
- [ ] test-results/ with 3+ game reports
- [ ] Demo video (2-5 minutes)

### Manual Testing Validation Methodology

**Approach**: Human evaluators will manually test the same games to establish ground truth for accuracy measurement.

**Process**:
1. **Game Selection**: Choose 5-7 games across different types (puzzle, platformer, clicker)
2. **Human Evaluation**: 2-3 human evaluators independently play each game for 2-3 minutes
3. **Scoring**: Humans provide playability scores (0-100) using same criteria as LLM
4. **Consensus**: Take average of human scores as ground truth
5. **Comparison**: Calculate accuracy as `1 - abs(llm_score - human_score) / 100`

**Criteria for Human Evaluators**:
- Does the game load without errors? (20 points)
- Are controls responsive and intuitive? (30 points)  
- Is the game engaging/fun to play? (25 points)
- Does it crash or have technical issues? (-25 points)
- Overall polish and completeness (25 points)

**Consistency Testing**:
- Run same game through QA pipeline 3 times
- Calculate standard deviation of scores
- Target: <10 points variance between runs
- If variance >10, investigate prompt inconsistency

**Example Validation Game Set**:
1. **Tic-Tac-Toe** (Simple puzzle) - Expected: 85-95
2. **2048 Clone** (Logic puzzle) - Expected: 80-90  
3. **Simple Platformer** (Keyboard controls) - Expected: 70-85
4. **Cookie Clicker** (Idle game) - Expected: 90-100
5. **Broken Game** (Intentionally buggy) - Expected: 0-30

---

## Future: Feedback Loop Integration (Out of Scope)

**Context**: While feedback loops are out of scope for MVP, designing with future integration in mind could maximize long-term value.

### Potential Feedback Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Game Generation Agent                        │
│  • Creates HTML5/WebGL games                                     │
│  • Iterates based on feedback                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ generates
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Generated Game                             │
│  • Hosted on temporary URL                                       │
│  • Ready for automated testing                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ tests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QA Pipeline (This System)                   │
│  • Automated playability testing                                 │
│  • Structured feedback generation                                │
└────────────────────────────┬────────────────────────────────────┘
                             │ feedback
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feedback Processor                            │
│  • Extracts actionable insights from QA reports                  │
│  • Maps issues to generation parameters                          │
│  • Provides structured improvement suggestions                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ improves
                             ▼
                        [Back to Game Generation Agent]
```

### Key Design Considerations for Feedback Loops

**1. Structured Feedback Format**
- Current QA reports already include structured data (playability score, confidence, issues)
- Could enhance with specific feedback categories:
  ```typescript
  interface FeedbackReport extends QAReport {
    improvementSuggestions: {
      controls: string[];      // "Add keyboard controls", "Improve button responsiveness"
      ui: string[];           // "Increase button size", "Add game instructions"
      gameplay: string[];     // "Reduce difficulty", "Add progression feedback"
      technical: string[];    // "Fix loading errors", "Optimize performance"
    };
    generationParameters: {   // Map back to generation agent parameters
      controlScheme: string;
      difficultyLevel: number;
      uiTheme: string;
    };
  }
  ```

**2. Issue Classification System**
- Categorize common game issues to enable systematic improvement
- Build knowledge base of issue → fix patterns
- Examples:
  - "Start button not found" → Improve button visibility/positioning
  - "Controls unresponsive" → Add keyboard event handlers
  - "Game crashes after 30s" → Memory management fixes

**3. Iterative Testing Pipeline**
```typescript
async function iterativeGameTesting(gameGenerationPrompt: string) {
  let iteration = 0;
  let game = await generateGame(gameGenerationPrompt);
  
  while (iteration < MAX_ITERATIONS) {
    const qaReport = await runQATest(game.url);
    
    if (qaReport.playabilityScore > THRESHOLD) {
      return { game, qaReport }; // Success!
    }
    
    const improvements = extractImprovements(qaReport);
    game = await regenerateGame(game, improvements);
    iteration++;
  }
  
  return { game, qaReport: "Max iterations reached" };
}
```

**4. Analytics & Learning**
- Track improvement patterns over time
- Identify which feedback types lead to better games
- Build predictive models for game success

**5. Integration Points**
- **Webhook Integration**: Game generation agent calls QA pipeline via webhook
- **Database Integration**: Store all QA results for analysis and learning
- **API Design**: Expose QA pipeline as REST API with batch testing capabilities

### Estimated Additional Development (Future Phase)

- **Feedback Enhancement**: 1-2 weeks to add structured improvement suggestions
- **Integration API**: 1 week to build webhook/REST API interface  
- **Analytics Dashboard**: 2-3 weeks for feedback analysis and visualization
- **Iterative Testing**: 1 week to build retry/improvement loop logic

**Note**: Current MVP architecture supports this future direction without major refactoring.

---

## Appendix

### Useful Commands

```bash
# Development
npm run dev              # Run example script
npm run qa <url>         # Run QA test (once implemented)
npm run build            # Compile TypeScript

# Testing
npm test                 # Run tests (if implemented)
npm run test:watch       # Watch mode

# Deployment
npm run deploy           # Deploy to Lambda (via Serverless)
serverless logs -f qa    # View Lambda logs

# S3 Management
aws s3 ls s3://dreamup-qa-results/                    # List all results
aws s3 ls s3://dreamup-qa-results/game-123/ --recursive  # List game results
aws s3 rm s3://dreamup-qa-results/ --recursive        # Clear all (danger!)
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BROWSERBASE_API_KEY` | Yes | - | Browserbase authentication |
| `BROWSERBASE_PROJECT_ID` | Yes | - | Browserbase project identifier |
| `ANTHROPIC_API_KEY` | Yes | - | Claude API authentication |
| `AWS_REGION` | No | `us-east-1` | AWS region for S3 |
| `S3_BUCKET_NAME` | Yes | - | S3 bucket for artifacts |
| `MAX_TEST_DURATION` | No | `270000` | Max test time (ms) |
| `MAX_RETRIES` | No | `3` | Retry attempts for failures |
| `LOG_LEVEL` | No | `info` | Logging verbosity |

### Troubleshooting

**Problem:** "Error: BROWSERBASE_API_KEY is not defined"  
**Solution:** Check `.env` file exists and is properly formatted. Restart terminal to reload environment.

**Problem:** Screenshots are blank/black  
**Solution:** Game may not be loading. Check Browserbase session replay. Try adding a longer wait time after navigation.

**Problem:** LLM returns low confidence scores  
**Solution:** Take more screenshots, improve prompt specificity, ensure screenshots capture meaningful game state.

**Problem:** Lambda timeout  
**Solution:** Reduce MAX_TEST_DURATION, optimize interaction speed, or increase Lambda timeout to 5 minutes.

**Problem:** S3 upload fails with "Access Denied"  
**Solution:** Check IAM permissions. Ensure Lambda role has `s3:PutObject` on the bucket.

---

## Contact & Support

**Project Owner:** Employee  
**Email:** employee@superbuilders  
**Slack:** [Link if available]

**For issues:**
1. Check this PRD first
2. Review docs/ directory
3. Search GitHub issues in Stagehand repo
4. Ask in Slack or email Matt

---

## Version History

- **v1.0** (2025-11-03): Initial PRD based on project requirements
- Created after clarification session with stakeholder
- Covers Phases 0-4 with optional Phase 5 stretch goals

---

**Next Steps:**
1. Review this PRD with stakeholders
2. Begin Phase 0 (Setup)
3. Complete Phase 1 checkpoint within first day
4. Iterate based on manual test results

