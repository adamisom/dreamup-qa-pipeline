# DreamUp QA Pipeline - Developer Quick Reference

**🎯 Goal**: AI-powered browser game testing with Claude vision analysis

## 🚀 **Quick Start Commands**
```bash
# Setup (Day 1)
npx create-browser-app dreamup-qa-pipeline
npm run dev  # Test Browserbase connection
node test-integration.js  # Verify all APIs

# Development (Days 2-7)  
npm run qa https://example.com  # Test pipeline
npm run build  # Check TypeScript
serverless deploy  # Deploy to Lambda
```

## 🏗 **Architecture Overview**
```
Browser (Browserbase) → Screenshots → S3 → Claude Analysis → JSON Report
```

## 📁 **Project Structure**
```
src/
├── browser/           # Stagehand automation
├── capture/           # Screenshots + console logs  
├── llm/               # Claude evaluation
├── storage/           # S3 operations
├── schemas/           # Zod type definitions
├── utils/             # Config + retry logic
└── qa-agent.ts        # Main orchestrator
```

## 🔑 **Core APIs**
- **Browserbase**: Remote browser automation
- **Stagehand**: Browser control SDK  
- **Anthropic**: Claude 3.5 Sonnet for vision analysis
- **Vercel AI SDK**: Structured LLM outputs with Zod
- **AWS S3**: Screenshot/log storage

## 📝 **Essential Types**
```typescript
interface Screenshot {
  s3Url: string;
  timestamp: string; 
  trigger: string;
}

interface QAReport {
  status: 'pass' | 'fail' | 'error';
  playabilityScore: number; // 0-100
  confidence: number; // 0-1
  screenshots: Screenshot[];
  issues: Issue[];
}
```

## 🔄 **Main Flow**
1. **Load Game** → Navigate to URL, take screenshot
2. **Interact** → Find start button, basic inputs, screenshots
3. **Evaluate** → Send screenshots to Claude for analysis  
4. **Report** → Return structured JSON with S3 URLs

## ⚙️ **Key Configuration**
```typescript
// .env requirements
BROWSERBASE_API_KEY=bb_live_xxx
BROWSERBASE_PROJECT_ID=xxx-xxx-xxx  
ANTHROPIC_API_KEY=sk-ant-xxx
S3_BUCKET_NAME=dreamup-qa-results
AWS_REGION=us-east-1
```

## 🧪 **Testing Strategy**
- **Phase 1**: Simple heuristics (page load, console errors)
- **Phase 2**: Claude vision analysis (3-5 screenshots)  
- **Phase 3**: Multiple game types (puzzle, platformer, clicker)

## 📦 **Deployment**
- **Local**: `npm run qa <url>`
- **Lambda**: Serverless framework or manual ZIP upload
- **Memory**: 512MB, 5min timeout
- **Bundle**: Webpack optimization recommended

## 🚨 **Critical Path**
1. **Day 1**: API verification (blocks everything)
2. **Day 2-3**: Basic pipeline working (MVP milestone)
3. **Day 4-5**: Claude integration (main feature)
4. **Day 6-7**: Production polish + deploy

## 📋 **Success Checkpoints**
```bash
# End of Day 1: APIs work
node test-integration.js  # All ✅ PASS

# End of Day 3: MVP complete  
npm run qa https://example.com  # Returns basic JSON

# End of Day 5: Claude integration
npm run qa https://playtictactoe.org  # Full QA report

# End of Day 7: Production ready
serverless deploy && curl -X POST [lambda-url]
```

## 🔗 **Key Dependencies**
- Never store screenshots in memory (immediate S3 upload)
- Debounce screenshots (500ms cooldown)  
- Use Zod for all LLM output validation
- Retry all external API calls (3x with backoff)
- Clean separation: Stagehand (browser) + Vercel AI SDK (LLM)

---

## 📖 Related Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Environment setup + API verification
- **[Implementation Tasks](IMPLEMENTATION_TASKS.md)** - 27 step-by-step development tasks  
- **[Schemas Reference](SCHEMAS_REFERENCE.md)** - Complete Zod type definitions
- **[Architecture Deep Dive](ARCHITECTURE_DEEP_DIVE.md)** - System design details
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Lambda production deployment
- **[Complete PRD](COMPLETE_PRD_REFERENCE.md)** - Full 3,700+ line specification

**🎯 Next Steps**: Start with [Setup Guide](SETUP_GUIDE.md) → [Implementation Tasks](IMPLEMENTATION_TASKS.md)
