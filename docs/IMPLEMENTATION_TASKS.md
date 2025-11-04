# Implementation Tasks - DreamUp QA Pipeline

**🎯 Goal**: 27 implementable tasks broken into 1-4 hour chunks with clear acceptance criteria

**Notation**: 
- 🔗 = Has dependencies (wait for prerequisite tasks)
- ⚠️ = Critical path item (blocks other tasks)  
- 🧪 = Includes verification/testing step

## 📋 **Phase 0: Environment Setup (Day 1)**

### **0.1** ⚠️ **Project Initialization** (1-2 hours)
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

### **0.2** ⚠️ **API Keys & Environment** (1 hour)
🔗 **Dependencies:** 0.1

**Tasks:**
1. Create `.env` file with all required variables
2. Test each API key individually
3. Run verification script from setup guide

**Acceptance Criteria:**
- [ ] `.env` file contains: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `ANTHROPIC_API_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
- [ ] All API verification tests pass (see setup guide)
- [ ] S3 bucket exists and is accessible

**Verification:** Run `node test-integration.js` - all tests show ✅ PASS

---

### **0.3** **Project Structure Setup** (1 hour)  
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

## 📋 **Phase 1: Core MVP (Days 2-3)**

### **1.1** ⚠️ **Basic Type Definitions** (1 hour)
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

### **1.2** ⚠️ **Environment Configuration** (1 hour)
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

### **1.3** **Basic S3 Client** (2 hours)
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

### **1.4** ⚠️ **Stagehand Browser Client** (2-3 hours)
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

### **1.5** **Screenshot Manager with S3** (2 hours)
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

### **1.6** **Basic Game Loader** (2 hours)  
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

### **1.7** **Simple Heuristic Evaluator** (1 hour)
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

### **1.8** ⚠️ **Basic CLI Interface** (2 hours)
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

## 📋 **Phase 2: LLM Integration (Days 4-5)**

### **2.1** **Zod Schemas for LLM** (1 hour)
🔗 **Dependencies:** 1.1

**File:** `src/schemas/report-schema.ts`
```typescript
export const QAReportSchema = z.object({
  status: z.enum(['pass', 'fail', 'error']),
  playabilityScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  // ... (use corrected schemas from schemas reference)
});
```

**Acceptance Criteria:**
- [ ] All schemas compile without errors
- [ ] Can parse valid JSON
- [ ] Rejects invalid JSON with clear errors
- [ ] Exports all required types

**Verification:** Test with valid/invalid JSON objects

---

### **2.2** **Anthropic Client Setup** (1 hour)
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

### **2.3** **Basic Game Interaction** (3 hours)
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

### **2.4** **LLM Prompt Engineering** (2 hours)
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

### **2.5** ⚠️ **Integration: Multi-Screenshot Pipeline** (2 hours)
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

### **2.6** **Retry Logic & Error Handling** (2 hours)
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

## 📋 **Phase 3: Production Features (Day 6)**

### **3.1** **Console Log Capture** (2 hours)
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

### **3.2** **Comprehensive Game Testing** (3 hours)
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

### **3.3** **S3 Enhancement & Cleanup** (1 hour)  
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

## 📋 **Phase 4: Polish & Deployment (Day 7)**

### **4.1** **Lambda Handler** (1 hour)
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

### **4.2** **Documentation** (2 hours)
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

### **4.3** **Final Testing & Demo** (2 hours)
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

**📖 Next Steps**: Use these tasks with `docs/QUICK_REFERENCE.md` for day-to-day development. See `docs/SCHEMAS_REFERENCE.md` for complete type definitions.
