# DreamUp Browser Game QA Pipeline

**🎯 AI-powered browser game testing with Claude vision analysis**

## Quick Start

```bash
# 1. Setup (Day 1)
npx create-browser-app dreamup-qa-pipeline
cd dreamup-qa-pipeline

# 2. Configure APIs (see docs/SETUP_GUIDE.md)
# Add API keys to .env file

# 3. Test locally
npm run qa https://playtictactoe.org

# 4. Deploy to Lambda (see docs/DEPLOYMENT_GUIDE.md)  
serverless deploy
```

## 📋 Documentation Structure

### 🚀 **For Developers**
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Essential info for daily coding (156 lines)
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Environment setup + API verification 
- **[Implementation Tasks](docs/IMPLEMENTATION_TASKS.md)** - 27 tasks broken into 1-4 hour chunks

### 🏗 **For Architecture**  
- **[Architecture Deep Dive](docs/ARCHITECTURE_DEEP_DIVE.md)** - System design + technical decisions
- **[Schemas Reference](docs/SCHEMAS_REFERENCE.md)** - Complete Zod type definitions

### 🚀 **For Deployment**
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production Lambda deployment
- **[Complete PRD Reference](docs/COMPLETE_PRD_REFERENCE.md)** - Full specification (3,700+ lines)

## 🎯 What This System Does

```
Browser Game URL → Screenshots → Claude Analysis → JSON QA Report
```

1. **Automates browser testing** of HTML5/WebGL games
2. **Captures evidence** (screenshots + console logs)
3. **AI evaluation** using Claude 3.5 Sonnet vision
4. **Structured reports** with playability scores (0-100)

## 🏗 Architecture Overview

- **Browser**: Browserbase cloud automation
- **AI**: Claude 3.5 Sonnet via Vercel AI SDK
- **Storage**: AWS S3 for screenshots/logs
- **Deployment**: AWS Lambda (serverless)
- **Languages**: TypeScript with Zod validation

## 📊 Implementation Timeline

- **Day 1**: Setup + API verification → Working environment
- **Days 2-3**: Core MVP → `npm run qa <url>` working
- **Days 4-5**: LLM integration → Full Claude evaluation  
- **Day 6**: Production features → Console logs, comprehensive testing
- **Day 7**: Deployment + docs → Lambda-ready with documentation

## 🎮 Supported Games

- ✅ **HTML5 Canvas games** (95% of modern browser games)
- ✅ **WebGL games** (Unity WebGL, Three.js, etc.)
- ✅ **DOM-based games** (pure HTML/CSS/JS)
- ❌ Flash, Unity WebPlayer, native apps

## 🔧 Development Workflow

### For AI Agents (like Claude in Cursor):
1. **Pin [Quick Reference](docs/QUICK_REFERENCE.md)** - Keep open during coding
2. **Work task-by-task** - Use [Implementation Tasks](docs/IMPLEMENTATION_TASKS.md)
3. **Reference as needed** - Full PRD available for deeper questions

### For Human Developers:
1. **Start with [Setup Guide](docs/SETUP_GUIDE.md)** - Get environment ready
2. **Follow [Implementation Tasks](docs/IMPLEMENTATION_TASKS.md)** - 27 specific tasks
3. **Deploy with [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Lambda production

## 📈 Success Metrics

- **Functionality**: Tests 3+ game types end-to-end
- **Accuracy**: 80%+ playability assessment vs manual evaluation
- **Reliability**: 90%+ test completion rate
- **Performance**: <5 minutes per game test
- **Cost**: <$0.25 per test

## 🚨 Key Technical Decisions

- **Cloud-first**: No local browser dependencies (Lambda-friendly)
- **Immediate S3 upload**: Prevents memory accumulation
- **Debounced screenshots**: Cost control (max 1 per 500ms)
- **Structured outputs**: Zod validation for all LLM responses
- **Clean separation**: Stagehand (browser) + AI SDK (LLM)

## 🔗 External Dependencies

- **Browserbase**: Remote browser automation
- **Anthropic**: Claude 3.5 Sonnet API
- **AWS S3**: Screenshot/log storage
- **Stagehand**: Browser automation SDK
- **Vercel AI SDK**: LLM structured outputs

## 📞 Support

1. Check relevant doc in `docs/` folder
2. Review [Quick Reference](docs/QUICK_REFERENCE.md) for common issues
3. See [Complete PRD](docs/COMPLETE_PRD_REFERENCE.md) for comprehensive details

---

**🎯 Start Here**: [Setup Guide](docs/SETUP_GUIDE.md) → [Implementation Tasks](docs/IMPLEMENTATION_TASKS.md) → [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
