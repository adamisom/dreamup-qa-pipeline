// Demo script to showcase the QA Pipeline foundation
// Tests all our core components working together

import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { Config } from "./src/utils/config";
import { S3StorageClient } from "./src/storage/s3-client";
import { createHash } from 'node:crypto';

async function runDemo() {
  console.log("🎮 DreamUp QA Pipeline - Foundation Demo");
  console.log("=" .repeat(50));
  
  try {
    // 1. Test Configuration System
    console.log("\n📋 1. Testing Configuration System...");
    Config.validate(); // Throws if env vars missing
    const env = Config.getEnv();
    const qaConfig = env.qaConfig;
    
    console.log("✅ Environment validated successfully");
    console.log(`   Max test duration: ${qaConfig.maxTestDuration}ms`);
    console.log(`   Screenshot debounce: ${qaConfig.screenshotDebounce}ms`);
    console.log(`   S3 bucket: ${env.s3BucketName}`);
    
    // 2. Test S3 Storage Client
    console.log("\n🗄️  2. Testing S3 Storage Client...");
    const s3Client = new S3StorageClient();
    
    // Create a test "screenshot" (just some dummy data)
    const testScreenshot = Buffer.from("Fake screenshot data for testing");
    const gameId = createHash('md5').update('https://example-game.com').digest('hex');
    const timestamp = new Date().toISOString();
    const screenshotKey = S3StorageClient.generateScreenshotKey(
      gameId, 
      timestamp, 
      'test-screenshot.png'
    );
    
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Screenshot key: ${screenshotKey}`);
    
    // Upload test screenshot
    const s3Url = await s3Client.uploadScreenshot(screenshotKey, testScreenshot);
    console.log("✅ Screenshot uploaded successfully");
    console.log(`   S3 URL: ${s3Url}`);
    
    // Generate presigned URL
    const presignedUrl = await s3Client.generatePresignedUrl(screenshotKey);
    console.log("✅ Presigned URL generated");
    console.log(`   Viewable URL: ${presignedUrl.substring(0, 80)}...`);
    
    // 3. Test Browser Automation
    console.log("\n🌐 3. Testing Browser Automation...");
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: env.browserbaseApiKey,
      projectId: env.browserbaseProjectId,
    });
    
    await stagehand.init();
    console.log("✅ Browserbase session created");
    
    const sessionUrl = `https://browserbase.com/sessions/${stagehand.browserbaseSessionId}`;
    console.log(`   🔗 Watch live: ${sessionUrl}`);
    
    // Navigate to a simple test page
    const page = stagehand.context.pages()[0];
    await page.goto("https://example.com");
    console.log("✅ Navigated to example.com");
    
    // Take a real screenshot
    const screenshot = await page.screenshot();
    console.log(`✅ Screenshot captured (${screenshot.length} bytes)`);
    
    // Upload the real screenshot
    const realScreenshotKey = S3StorageClient.generateScreenshotKey(
      'demo-test',
      new Date().toISOString(),
      'example-com-screenshot.png'
    );
    
    const realS3Url = await s3Client.uploadScreenshot(realScreenshotKey, screenshot);
    console.log("✅ Real screenshot uploaded to S3");
    
    // Generate viewable URL for the real screenshot
    const realPresignedUrl = await s3Client.generatePresignedUrl(realScreenshotKey);
    console.log(`   📸 View screenshot: ${realPresignedUrl}`);
    
    // Test Stagehand's AI capabilities
    console.log("\n🤖 4. Testing AI Analysis...");
    try {
      const extractResult = await stagehand.extract(
        "What is the main heading text on this page?"
      );
      console.log("✅ AI extraction successful");
      console.log(`   Result: ${JSON.stringify(extractResult, null, 2)}`);
    } catch (error) {
      console.log("⚠️  AI extraction needs model configuration (will fix in Phase 2)");
      console.log(`   Error: ${error.message}`);
    }
    
    // Clean up browser session
    await stagehand.close();
    console.log("✅ Browser session closed");
    
    // 5. Demo Summary
    console.log("\n🎯 Foundation Demo Complete!");
    console.log("=" .repeat(50));
    console.log("✅ Configuration system working");
    console.log("✅ S3 storage client working"); 
    console.log("✅ Browser automation working");
    console.log("✅ Screenshot capture working");
    console.log("✅ Modular architecture in place");
    console.log("\n🚀 Ready to build the full QA pipeline!");
    
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    console.error(error.stack);
  }
}

// Run the demo
runDemo().catch(console.error);
