# DreamUp Browser Game QA Pipeline

**🎯 AI-powered browser game testing with Claude vision analysis**

## Quick Start

```bash
# 1. Setup
npm install
cp .env.example .env  # Add your API keys

# 2. Test locally
npm run qa https://example.com

# 3. Run tests
npm test

# 4. Deploy to Lambda (see docs/misc/DEPLOYMENT_GUIDE.md)
# serverless deploy
```

## What This Does

Automatically tests browser games by:
1. **Loading** the game in a cloud browser (Browserbase)
2. **Capturing** screenshots and console logs
3. **Evaluating** playability using AI (Claude 3.5 Sonnet)
4. **Reporting** structured JSON results with S3 URLs

## Project Structure

```
src/
├── browser/        # Stagehand automation (game loading, navigation)
├── capture/        # Screenshots + console log capture
├── llm/            # AI evaluation (SimpleEvaluator, future: Claude)
├── storage/        # S3 operations (uploads, presigned URLs)
├── schemas/        # TypeScript type definitions
├── utils/          # Shared utilities (errors, timing, validation, etc.)
└── qa-agent.ts      # Main orchestrator

handler.ts          # AWS Lambda handler for serverless deployment
```

## Usage

### CLI (Local Development)

```bash
npm run qa https://playtictactoe.org
```

Returns JSON:
```json
{
  "status": "pass",
  "gameUrl": "https://playtictactoe.org",
  "screenshots": [...],
  "consoleLogsUrl": "https://...",
  "duration": 12345
}
```

### Lambda (Production)

Deploy to AWS Lambda and invoke via API Gateway:

```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/qa \
  -H "Content-Type: application/json" \
  -d '{"gameUrl": "https://example.com/game"}'
```

## Configuration

Required environment variables (see `.env.example`):

- `BROWSERBASE_API_KEY` - Browser automation
- `BROWSERBASE_PROJECT_ID` - Browserbase project
- `ANTHROPIC_API_KEY` - Claude AI evaluation
- `AWS_REGION` - AWS region (default: us-east-1)
- `S3_BUCKET_NAME` - S3 bucket for screenshots/logs

Optional:
- `MAX_TEST_DURATION` - Max test time in ms (default: 270000 = 4.5 min)
- `SCREENSHOT_DEBOUNCE` - Min time between screenshots in ms (default: 500)
- `BROWSERBASE_TIMEOUT` - Browser navigation timeout in ms (default: 60000)

## Development

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Watch mode tests
npm run test:watch

# Test coverage
npm run test:coverage

# Integration test (requires API keys)
node test-integration.js
```

## Documentation

- **[Quick Reference](docs/misc/QUICK_REFERENCE.md)** - Daily development guide
- **[Setup Guide](docs/misc/SETUP_GUIDE.md)** - Environment setup
- **[Implementation Tasks](docs/IMPLEMENTATION_TASKS.md)** - 27 step-by-step tasks
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Deployment Guide](docs/misc/DEPLOYMENT_GUIDE.md)** - Lambda deployment
- **[Complete PRD](docs/PRD.md)** - Full specification

## Features

✅ **Phase 1**: Foundation - Config, S3 client, types  
✅ **Phase 2**: Core MVP - Browser automation, screenshot capture, basic evaluation  
✅ **Phase 3**: Production - Console log capture, S3 retry logic  
✅ **Phase 4**: Deployment - Lambda handler, documentation  

## Testing

- **79 unit tests** covering utilities and core business logic
- **Integration tests** for API connections
- **End-to-end** testing via `npm run qa <url>`

## Tech Stack

- **TypeScript** - Type safety
- **Stagehand** - Browser automation (Browserbase)
- **Anthropic Claude** - AI evaluation
- **AWS S3** - Screenshot/log storage
- **AWS Lambda** - Serverless deployment
- **Vitest** - Unit testing

## License

See LICENSE file for details.
