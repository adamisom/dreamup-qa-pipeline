# Deployment Guide - DreamUp QA Pipeline

**🎯 Purpose**: Step-by-step production deployment to AWS Lambda

## Deployment Architecture

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

## Prerequisites

- ✅ Local development working (see Setup Guide)
- ✅ All integration tests passing
- ✅ AWS CLI configured with deployment permissions
- ✅ S3 bucket created and accessible

## Handler Implementation

The `handler.ts` file is already created in the project root. It handles:

- ✅ API Gateway events (POST requests)
- ✅ CORS headers for browser access (via `http-responses` utility)
- ✅ Request validation (gameUrl required)
- ✅ Error handling with proper HTTP status codes
- ✅ JSON parsing and response formatting
- ✅ OPTIONS preflight requests for CORS

**Implementation Details:**
```typescript
// handler.ts uses utilities from src/utils/http-responses.ts:
// - getCorsHeaders() - Standard CORS headers
// - createSuccessResponse() - 200 responses
// - createErrorResponse() - Error responses with status codes
// - createCorsPreflightResponse() - OPTIONS handling

// Request format:
POST /qa
Content-Type: application/json
{
  "gameUrl": "https://example.com/game"
}

// Response format:
{
  "status": "pass" | "fail" | "error",
  "gameUrl": "https://example.com/game",
  "screenshots": [...],
  "consoleLogsUrl": "https://...",
  "duration": 12345
}
```

**Usage:**
```typescript
// Lambda handler is ready at handler.ts
// Deploy with: serverless deploy
```

## Deployment Options

### Option 1: Webpack Bundling (Recommended)

**Why Webpack**: Optimizes bundle size, reduces cold start times, simplifies dependency management.

#### Step 1: Install Webpack Dependencies

```bash
npm install --save-dev webpack webpack-cli webpack-node-externals terser-webpack-plugin ts-loader
```

#### Step 2: Create Webpack Configuration

Create `webpack.config.js`:

```javascript
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './handler.ts',
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
```

#### Step 3: Add Build Scripts

Update `package.json`:

```json
{
  "scripts": {
    "build": "webpack",
    "build:dev": "webpack --mode development",
    "deploy:build": "npm run build && cd dist && npm install --production --no-package-lock",
    "deploy:package": "npm run deploy:build && cd dist && zip -r ../function.zip ."
  }
}
```

#### Step 4: Build and Package

```bash
# Build optimized bundle
npm run build

# Install production dependencies in dist/
cd dist && npm install --production --no-package-lock

# Create deployment package
zip -r ../function.zip .
cd ..
```

#### Step 5: Deploy to Lambda

```bash
# Create Lambda function
aws lambda create-function \
  --function-name dreamup-qa-pipeline \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{
    \"BROWSERBASE_API_KEY\":\"$BROWSERBASE_API_KEY\",
    \"BROWSERBASE_PROJECT_ID\":\"$BROWSERBASE_PROJECT_ID\",
    \"ANTHROPIC_API_KEY\":\"$ANTHROPIC_API_KEY\",
    \"S3_BUCKET_NAME\":\"dreamup-qa-results\",
    \"AWS_REGION\":\"us-east-1\"
  }"
```

**Bundle Size Comparison:**
- Without webpack: ~50-100MB (full node_modules)
- With webpack: ~5-15MB (optimized bundle)

### Option 2: Serverless Framework (Production Ready)

#### Step 1: Install Serverless

```bash
npm install -g serverless
npm install --save-dev serverless-plugin-typescript
```

#### Step 2: Create Serverless Configuration

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
    AWS_REGION: us-east-1
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:PutObject
        - s3:GetObject
        - s3:PutObjectAcl
      Resource: "arn:aws:s3:::dreamup-qa-results/*"
    - Effect: Allow
      Action:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
      Resource: "arn:aws:logs:*:*:*"

functions:
  qa:
    handler: handler.handler
    events:
      - http:
          path: qa
          method: post
          cors: true

plugins:
  - serverless-plugin-typescript

package:
  exclude:
    - docs/**
    - test-results/**
    - "*.md"
    - ".git/**"
```

#### Step 3: Deploy with Serverless

```bash
# Deploy to AWS
serverless deploy

# Test deployment
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/qa \
  -H "Content-Type: application/json" \
  -d '{"gameUrl":"https://playtictactoe.org"}'
```

### Option 3: Manual Deployment (Fallback)

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
  --memory-size 512

# 4. Test invocation
aws lambda invoke \
  --function-name dreamup-qa-pipeline \
  --payload '{"body":"{\"gameUrl\":\"https://example.com\"}"}' \
  response.json

cat response.json
```

## Required IAM Role

Create Lambda execution role with these permissions:

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

Create the role:

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name lambda-dreamup-qa-role \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name lambda-dreamup-qa-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name lambda-dreamup-qa-role \
  --policy-name S3Access \
  --policy-document file://s3-policy.json
```

## Environment Variables

Lambda needs these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `BROWSERBASE_API_KEY` | Yes | Browserbase authentication |
| `BROWSERBASE_PROJECT_ID` | Yes | Browserbase project identifier |
| `ANTHROPIC_API_KEY` | Yes | Claude API authentication |
| `S3_BUCKET_NAME` | Yes | S3 bucket for artifacts |
| `AWS_REGION` | No | AWS region (defaults to us-east-1) |
| `MAX_TEST_DURATION` | No | Max test time (defaults to 270000ms) |
| `MAX_RETRIES` | No | Retry attempts (defaults to 3) |

Set via AWS CLI:

```bash
aws lambda update-function-configuration \
  --function-name dreamup-qa-pipeline \
  --environment Variables="{
    \"BROWSERBASE_API_KEY\":\"$BROWSERBASE_API_KEY\",
    \"BROWSERBASE_PROJECT_ID\":\"$BROWSERBASE_PROJECT_ID\",
    \"ANTHROPIC_API_KEY\":\"$ANTHROPIC_API_KEY\",
    \"S3_BUCKET_NAME\":\"dreamup-qa-results\"
  }"
```

## Testing Your Deployment

### Local Lambda Testing

Test Lambda handler locally:

```bash
# Install lambda-local for testing
npm install -g lambda-local

# Test with sample event
echo '{"body":"{\"gameUrl\":\"https://example.com\"}"}' > test-event.json
lambda-local -l handler.js -h handler -e test-event.json
```

### API Gateway Testing

```bash
# Test via HTTP (if using Serverless Framework)
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/qa \
  -H "Content-Type: application/json" \
  -d '{
    "gameUrl": "https://playtictactoe.org"
  }'
```

### Direct Lambda Invocation

```bash
# Test via AWS CLI
aws lambda invoke \
  --function-name dreamup-qa-pipeline \
  --payload '{"body":"{\"gameUrl\":\"https://playtictactoe.org\"}"}' \
  --cli-binary-format raw-in-base64-out \
  response.json

# Check response
cat response.json | jq .
```

## Monitoring and Logging

### CloudWatch Logs

View function logs:

```bash
# Get log streams
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/dreamup-qa-pipeline" \
  --order-by LastEventTime \
  --descending

# View recent logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/dreamup-qa-pipeline" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Metrics to Monitor

Key CloudWatch metrics:
- **Duration**: Function execution time
- **Errors**: Function failures
- **Throttles**: Concurrency limits hit
- **Cold Starts**: New container initializations

### Custom Logging

Add structured logging in your code:

```typescript
// In your handler or QA agent
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'QA test started',
  gameUrl: gameUrl,
  gameId: gameId
}));
```

## Cost Optimization

### Current Configuration
- **Memory**: 512MB (sufficient for orchestration)
- **Timeout**: 5 minutes (max test duration)
- **Runtime**: Node.js 20 (latest LTS)

### Cost Estimates (Low Volume)
- **Lambda execution**: ~$0.000001 per test
- **CloudWatch Logs**: ~$0.01/month for 1000 tests
- **Total Lambda costs**: <$1/month for development

### Optimization Tips
1. **Bundle size**: Use webpack to reduce cold starts
2. **Memory allocation**: 512MB is optimal for this workload
3. **Timeout**: Set to actual needs (~4.5 minutes)
4. **Concurrent executions**: Start with 10, increase as needed

## Troubleshooting

### Common Deployment Issues

**Issue**: "Module not found" errors
```bash
# Solution: Verify webpack externals configuration
npm run build
ls -la dist/  # Should see bundled handler.js
```

**Issue**: Lambda timeout
```bash
# Solution: Check function configuration
aws lambda get-function-configuration --function-name dreamup-qa-pipeline
# Verify timeout is 300 seconds, memory is 512MB
```

**Issue**: Environment variables not set
```bash
# Solution: Verify environment variables
aws lambda get-function-configuration --function-name dreamup-qa-pipeline | jq .Environment
```

**Issue**: S3 permission denied
```bash
# Solution: Check IAM role has S3 permissions
aws iam get-role-policy --role-name lambda-dreamup-qa-role --policy-name S3Access
```

### Debugging Steps

1. **Check CloudWatch Logs** for error details
2. **Test locally** with lambda-local first
3. **Verify environment variables** are set correctly
4. **Check IAM permissions** for S3 and logs
5. **Monitor API quotas** for external services

### Performance Issues

**Cold Start Optimization:**
- Use webpack bundling (reduces from 100MB to 10MB)
- Keep dependencies minimal
- Consider provisioned concurrency for production

**Memory Issues:**
- Monitor CloudWatch memory usage
- Increase memory if consistently >80%
- Verify immediate S3 upload (no memory accumulation)

## Production Checklist

### Pre-Deployment
- [ ] All local tests passing
- [ ] Integration tests with all APIs working
- [ ] Environment variables configured
- [ ] IAM roles and policies created
- [ ] S3 bucket exists with proper permissions

### Post-Deployment
- [ ] Function deploys successfully
- [ ] Test with sample game URL
- [ ] Verify S3 uploads working
- [ ] Check CloudWatch logs for errors
- [ ] Monitor initial performance metrics

### Ongoing Monitoring
- [ ] Set up CloudWatch alarms for errors
- [ ] Monitor API quota usage
- [ ] Track cost per test execution
- [ ] Review logs weekly for optimization opportunities

---

**🎯 Next Steps**: Once deployed, test with multiple game types and monitor performance. See `docs/QUICK_REFERENCE.md` for API usage examples.
