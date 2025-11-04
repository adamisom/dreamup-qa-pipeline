# Setup Guide - DreamUp QA Pipeline

**🎯 Goal**: Get your development environment ready in <1 hour

## Prerequisites

- **Node.js** v20 or v22
- **npm** latest
- **Git** for version control
- **macOS** (or Linux/Windows with adjustments)

## Step 1: Create Project from Template

```bash
# Run the interactive setup
npx create-browser-app dreamup-qa-pipeline

# When prompted:
# - Project name: dreamup-qa-pipeline
# - Select AI model: Claude (Anthropic)
# - Enter Anthropic API key: [your key]
# - Using Cursor or Windsurf?: [your choice]
# - Run locally or Browserbase?: Browserbase (we'll toggle this later)

cd dreamup-qa-pipeline
```

## Step 2: Obtain API Keys

### Browserbase
1. Go to https://browserbase.com
2. Sign up (free tier includes 60 minutes)
3. Create a project
4. Copy API Key and Project ID

### Anthropic
1. Go to https://console.anthropic.com
2. Create API key (you should already have this)

### AWS
1. Install AWS CLI if not already: `brew install awscli`
2. Run `aws configure`
3. Enter credentials (Access Key ID, Secret Access Key, region: `us-east-1`)

## Step 3: Configure Environment Variables

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

## Step 4: Create S3 Bucket

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

## Step 5: Install Additional Dependencies

```bash
npm install @ai-sdk/anthropic ai @aws-sdk/client-s3 zod dotenv
```

## Step 6: Configure Stagehand for Local Testing

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

## Step 7: Verify Setup & API Integration

Run the example script that comes with the template:

```bash
npm run dev  # or npm start
```

You should see:
- Browser session starts in Browserbase
- Navigates to a test URL
- Completes successfully

## Step 8: API Version & Integration Verification

**Critical: Run these verification steps before implementing to catch version mismatches early.**

### A. Verify Stagehand API Compatibility

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

### B. Verify Vercel AI SDK Integration

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

### C. Verify AWS S3 Integration

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

### D. Full Integration Test

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

## Troubleshooting

- If you see "API key invalid" → Check `.env` file
- If browser doesn't start → Check Browserbase dashboard for quota  
- If TypeScript errors → Run `npm install` again
- If Anthropic fails → Verify API key has sufficient credits AND check model identifier is correct
- If S3 fails → Check AWS credentials and region configuration
- If model not found → Check Anthropic documentation for current model names (claude-3-5-sonnet-20241022 may change)

## ✅ Setup Complete!

Once all verification tests pass, you're ready to start development. Proceed to `docs/IMPLEMENTATION_TASKS.md` for the step-by-step implementation guide.
