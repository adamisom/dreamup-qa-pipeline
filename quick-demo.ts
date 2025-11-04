// Quick Demo - DreamUp QA Pipeline Foundation
// Showcases core components without S3 dependencies

import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { Config } from "./src/utils/config.js";

async function quickDemo() {
  console.log("🚀 DreamUp QA Pipeline - Quick Demo");
  console.log("=" .repeat(45));
  
  try {
    // 1. Configuration System
    console.log("\n📋 Configuration System");
    Config.validate();
    const env = Config.getEnv();
    console.log("✅ Environment loaded & validated");
    console.log(`   Config: ${env.qaConfig.maxTestDuration}ms timeout, ${env.qaConfig.screenshotDebounce}ms debounce`);
    
    // 2. Browser Automation
    console.log("\n🌐 Browser Automation Test");
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: env.browserbaseApiKey,
      projectId: env.browserbaseProjectId,
    });
    
    await stagehand.init();
    console.log("✅ Remote browser session started");
    
    const sessionUrl = `https://browserbase.com/sessions/${stagehand.browserbaseSessionId}`;
    console.log(`🔗 Live session: ${sessionUrl}`);
    
    // 3. Navigate to a test page
    const page = stagehand.context.pages()[0];
    console.log("\n📄 Navigation Test");
    await page.goto("https://example.com");
    console.log("✅ Navigated to example.com");
    
    // 4. Take screenshot (but don't upload to S3)
    console.log("\n📸 Screenshot Capture");
    const screenshot = await page.screenshot();
    console.log(`✅ Screenshot captured: ${screenshot.length} bytes`);
    
    // 5. Test page interaction
    console.log("\n🎯 Page Interaction");
    try {
      const title = await page.title();
      console.log(`✅ Page title: "${title}"`);
      
      // Try to get some basic page info
      const url = await page.url();
      console.log(`✅ Current URL: ${url}`);
      
    } catch (error) {
      console.log("⚠️  Page interaction limited (expected)");
    }
    
    // 6. Clean up
    await stagehand.close();
    console.log("✅ Browser session closed");
    
    // 7. Foundation Summary
    console.log("\n🎊 Foundation Demo Results");
    console.log("=" .repeat(45));
    console.log("✅ Configuration System: WORKING");
    console.log("✅ Environment Validation: WORKING");
    console.log("✅ Browserbase Integration: WORKING");
    console.log("✅ Remote Browser Control: WORKING");
    console.log("✅ Screenshot Capture: WORKING");
    console.log("✅ Modular Architecture: READY");
    
    console.log("\n🚀 Ready for Phase 1 Development!");
    console.log("   Next: Browser game automation components");
    
  } catch (error) {
    console.error("\n❌ Demo error:", error instanceof Error ? error.message : String(error));
  }
}

quickDemo().catch(console.error);
