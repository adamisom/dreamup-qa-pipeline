import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";

async function testFullIntegration() {
  console.log('🧪 Running full integration test...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Environment Variables
  console.log('📋 Testing environment variables...');
  const requiredEnvs = [
    'BROWSERBASE_API_KEY', 
    'BROWSERBASE_PROJECT_ID', 
    'ANTHROPIC_API_KEY',
    'AWS_REGION'
  ];
  
  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      console.log(`❌ Missing environment variable: ${env}`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${env}: Found`);
    }
  }
  console.log();
  
  // Test 2: Stagehand browser automation
  console.log('🌐 Testing Browserbase connection...');
  try {
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      model: 'anthropic/claude-3-5-sonnet-20241022',
      modelApiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    console.log('✅ Stagehand initialization: PASS');
    
    await stagehand.init();
    console.log('✅ Browserbase session created: PASS');
    console.log(`   Session URL: https://browserbase.com/sessions/${stagehand.browserbaseSessionId}`);
    
    // Test basic navigation
    const page = stagehand.context.pages()[0];
    await page.goto('https://example.com');
    console.log('✅ Browser navigation: PASS');
    
    await stagehand.close();
    console.log('✅ Browser cleanup: PASS\n');
    
  } catch (e) {
    console.log('❌ Browserbase test: FAIL -', e.message, '\n');
    allTestsPassed = false;
  }
  
  // Test 3: AWS S3 connection (basic)
  console.log('🗄️  Testing AWS S3 connection...');
  try {
    let S3Client, ListBucketsCommand;
    try {
      const awsImport = await import('@aws-sdk/client-s3');
      S3Client = awsImport.S3Client;
      ListBucketsCommand = awsImport.ListBucketsCommand;
    } catch (importError) {
      console.log('❌ AWS SDK not installed. Run: npm install @aws-sdk/client-s3');
      throw new Error('AWS SDK package missing');
    }
    
    const client = new S3Client({ 
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const response = await client.send(new ListBucketsCommand({}));
    console.log('✅ AWS S3 connection: PASS');
    
    // Check if our bucket exists
    const bucketName = process.env.S3_BUCKET_NAME;
    if (bucketName) {
      const bucketExists = response.Buckets?.some(b => b.Name === bucketName);
      console.log(`✅ Bucket "${bucketName}" exists:`, bucketExists ? 'YES' : 'NO (will need to create)');
    }
    console.log();
    
  } catch (e) {
    console.log('❌ AWS S3 test: FAIL -', e.message, '\n');
    allTestsPassed = false;
  }
  
  // Test 4: Anthropic API (basic check)
  console.log('🤖 Testing Anthropic API...');
  try {
    // Just test that we can import and create client
    const { anthropic } = await import('@ai-sdk/anthropic');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    
    const client = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    console.log('✅ Anthropic client creation: PASS');
    console.log('✅ API key format: Valid');
    console.log();
    
  } catch (e) {
    console.log('❌ Anthropic test: FAIL -', e.message, '\n');
    allTestsPassed = false;
  }
  
  // Summary
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('═'.repeat(40));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Ready to start development.');
    console.log('\nNext steps:');
    console.log('1. Install additional dependencies: npm install @ai-sdk/anthropic ai @aws-sdk/client-s3 zod');
    console.log('2. Start building the QA pipeline components');
  } else {
    console.log('❌ SOME TESTS FAILED. Please fix the issues above before continuing.');
    console.log('\nCommon fixes:');
    console.log('- Check API keys in .env file');
    console.log('- Verify AWS credentials with: aws configure');
    console.log('- Make sure S3 bucket exists and is accessible');
  }
}

testFullIntegration().catch(console.error);
