# Testing Guide - DreamUp QA Pipeline

**🎯 Purpose**: Comprehensive manual testing procedures to verify system functionality

## 🚨 Smoke Tests (5 minutes)

**Run these first to verify core functionality before comprehensive testing:**

### 1. Environment Check
```bash
# Verify environment is configured
npm run build
npm test
```

**Expected**: ✅ Build succeeds, all 107+ tests pass

### 2. Basic CLI Test
```bash
# Test with a simple, reliable game
npm run qa https://playtictactoe.org
```

**Expected**: 
- ✅ Browser session starts
- ✅ Game loads successfully
- ✅ Returns JSON with `status: "pass"` or `status: "fail"`
- ✅ Contains `screenshots` array with at least 1 screenshot
- ✅ Contains `consoleLogsUrl` (if logs captured)
- ✅ `duration` is a positive number

### 3. Error Handling Test
```bash
# Test with invalid URL
npm run qa not-a-url
```

**Expected**:
- ✅ Returns JSON with `status: "error"`
- ✅ Contains `error: "Invalid URL format"`
- ✅ No browser session started

### 4. API Integration Test
```bash
# Verify all APIs are accessible
node test-integration.js
```

**Expected**: ✅ All API connections pass (Browserbase, S3, Anthropic)

**✅ If all smoke tests pass, proceed to comprehensive testing below.**

---

## 📋 Comprehensive Manual Testing

### Test Environment Setup

**Prerequisites:**
- ✅ All smoke tests passing
- ✅ `.env` file configured with valid API keys
- ✅ S3 bucket accessible
- ✅ Browserbase quota available

**Test Data:**
- Keep a list of test game URLs (various types)
- Monitor Browserbase dashboard for session activity
- Check S3 bucket for uploaded artifacts

---

## Test Category 1: Basic Functionality

### Test 1.1: Simple HTML5 Game
**Game**: https://playtictactoe.org  
**Expected Behavior:**
- ✅ Status: `pass` or `fail` (not `error`)
- ✅ At least 2 screenshots captured
- ✅ `consoleLogsUrl` present (if any logs)
- ✅ Duration < 60000ms (1 minute)
- ✅ Screenshot URLs are valid presigned URLs
- ✅ Console logs URL is valid (if present)

**Verification Steps:**
1. Run: `npm run qa https://playtictactoe.org`
2. Check JSON output structure
3. Visit screenshot URLs in browser (should load images)
4. Visit console logs URL (should load JSON)
5. Verify S3 bucket contains files: `{gameId}/{timestamp}/`

### Test 1.2: Game Load Failure
**Game**: https://invalid-game-url-that-does-not-exist-12345.com  
**Expected Behavior:**
- ✅ Status: `fail` or `error`
- ✅ Contains `error` message
- ✅ At least 1 screenshot (error state)
- ✅ Duration recorded
- ✅ Graceful failure (no crashes)

**Verification Steps:**
1. Run with invalid/non-existent URL
2. Verify error message is descriptive
3. Check that browser session cleaned up

### Test 1.3: URL Validation
**Test Cases:**
```bash
npm run qa "not a url"           # Should error: Invalid URL format
npm run qa "http://example.com"  # Should work
npm run qa "https://example.com" # Should work
npm run qa ""                    # Should error: Missing URL
```

**Expected**: All invalid URLs return `status: "error"` with clear error message

---

## Test Category 2: Console Log Capture

### Test 2.1: Console Error Detection
**Game**: Use a game that logs errors (or inject errors via browser console)  
**Expected Behavior:**
- ✅ Console errors captured
- ✅ `consoleLogsUrl` contains error logs
- ✅ Status: `fail` (if SimpleEvaluator detects errors)
- ✅ Error count > 0 in console report

**Verification Steps:**
1. Run test on game with console errors
2. Download console logs JSON from S3 URL
3. Verify errors are in the logs
4. Verify noise (analytics, extensions) is filtered out

### Test 2.2: Console Log Filtering
**Expected Behavior:**
- ✅ Analytics messages filtered out
- ✅ Extension messages filtered out
- ✅ Game-relevant logs kept
- ✅ All errors/warnings kept regardless of content

**Verification Steps:**
1. Check console logs JSON structure
2. Verify `filteredLogs` string doesn't contain analytics
3. Verify errors/warnings are present even if they match noise patterns

### Test 2.3: No Console Logs
**Game**: Simple game with no console output  
**Expected Behavior:**
- ✅ `consoleLogsUrl` may be undefined (if no logs)
- ✅ No errors thrown
- ✅ Test completes successfully

---

## Test Category 3: Screenshot Capture

### Test 3.1: Screenshot Debouncing
**Expected Behavior:**
- ✅ Multiple rapid screenshot requests are debounced
- ✅ Only 1 screenshot per 500ms (configurable)
- ✅ Screenshots uploaded immediately to S3
- ✅ Presigned URLs valid for 24 hours

**Verification Steps:**
1. Monitor S3 bucket during test
2. Verify screenshots appear with timestamps
3. Check screenshot URLs load in browser
4. Verify debounce timing (shouldn't see screenshots < 500ms apart)

### Test 3.2: Screenshot Organization
**Expected Behavior:**
- ✅ Screenshots organized: `{gameId}/{timestamp}/screenshot-{ms}.png`
- ✅ Same game URL = same gameId (consistent)
- ✅ Different timestamps for different test runs

**Verification Steps:**
1. Run same game URL twice
2. Verify same `gameId` in S3 paths
3. Verify different timestamp folders
4. Check screenshot filenames are unique

### Test 3.3: Screenshot Quality
**Expected Behavior:**
- ✅ Screenshots are valid PNG images
- ✅ Images are viewable in browser
- ✅ Reasonable file size (not corrupted)
- ✅ Images show actual game state

**Verification Steps:**
1. Download screenshots from presigned URLs
2. Open in image viewer
3. Verify they show game content (not blank/error pages)

---

## Test Category 4: Error Scenarios

### Test 4.1: Missing Environment Variables
**Test**: Remove required env var (e.g., `BROWSERBASE_API_KEY`)  
**Expected Behavior:**
- ✅ `Config.validate()` throws clear error
- ✅ Returns `status: "error"` with descriptive message
- ✅ No browser session attempted

### Test 4.2: Invalid API Keys
**Test**: Use invalid Browserbase API key  
**Expected Behavior:**
- ✅ Browser initialization fails gracefully
- ✅ Returns `status: "error"` with error message
- ✅ No partial state left behind

### Test 4.3: S3 Upload Failure
**Test**: Use invalid S3 bucket name  
**Expected Behavior:**
- ✅ Retry logic attempts 3 times
- ✅ Error caught and reported
- ✅ Test continues (screenshots may be missing but test completes)

### Test 4.4: Browser Timeout
**Test**: Use very short timeout (e.g., 1000ms)  
**Expected Behavior:**
- ✅ Timeout occurs gracefully
- ✅ Returns `status: "fail"` or `status: "error"`
- ✅ Error message indicates timeout
- ✅ Browser session cleaned up

---

## Test Category 5: Different Game Types

### Test 5.1: Canvas-Based Game
**Game**: https://playtictactoe.org (or similar)  
**Expected**: Works as expected

### Test 5.2: WebGL Game
**Game**: Find a Unity WebGL or Three.js game  
**Expected**: 
- ✅ Game loads (may take longer)
- ✅ Screenshots capture WebGL content
- ✅ Console logs capture WebGL errors if any

### Test 5.3: DOM-Based Game
**Game**: Simple HTML/CSS/JS game  
**Expected**: Works as expected

### Test 5.4: Game Requiring User Interaction
**Game**: Game with "Click to Start" requirement  
**Expected**:
- ✅ Game loads
- ✅ Screenshots show initial state
- ✅ May show "click to start" screen
- ✅ Status may be `fail` if interaction required (current MVP)

---

## Test Category 6: Lambda Handler (If Deployed)

### Test 6.1: POST Request
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/qa \
  -H "Content-Type: application/json" \
  -d '{"gameUrl": "https://playtictactoe.org"}'
```

**Expected**:
- ✅ Returns 200 status
- ✅ JSON response with QA result
- ✅ CORS headers present

### Test 6.2: CORS Preflight
```bash
curl -X OPTIONS https://your-api.execute-api.us-east-1.amazonaws.com/prod/qa \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"
```

**Expected**:
- ✅ Returns 200 status
- ✅ CORS headers in response
- ✅ Empty body

### Test 6.3: Invalid Request
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/qa \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Expected**:
- ✅ Returns 400 status
- ✅ Error message: "Missing or invalid gameUrl in request body"

### Test 6.4: Method Not Allowed
```bash
curl -X GET https://your-api.execute-api.us-east-1.amazonaws.com/prod/qa
```

**Expected**:
- ✅ Returns 405 status
- ✅ Error message: "Method not allowed. Use POST."

---

## Test Category 7: Performance & Reliability

### Test 7.1: Multiple Sequential Tests
**Test**: Run 3-5 tests in a row  
**Expected**:
- ✅ Each test completes independently
- ✅ No resource leaks
- ✅ Browser sessions properly cleaned up
- ✅ S3 uploads don't conflict

### Test 7.2: Test Duration
**Expected**:
- ✅ Most tests complete in < 60 seconds
- ✅ No tests exceed `MAX_TEST_DURATION` (4.5 minutes)
- ✅ Duration accurately reported in results

### Test 7.3: Memory Usage
**Test**: Monitor memory during test execution  
**Expected**:
- ✅ No memory accumulation (screenshots uploaded immediately)
- ✅ Memory returns to baseline after test
- ✅ No memory leaks over multiple tests

---

## Test Category 8: Edge Cases

### Test 8.1: Very Long Game URL
**Test**: URL with long query parameters  
**Expected**: Handles correctly, gameId generated properly

### Test 8.2: Special Characters in URL
**Test**: URL with encoded characters  
**Expected**: Handles correctly

### Test 8.3: Redirects
**Test**: URL that redirects to final game  
**Expected**: Follows redirects, tests final destination

### Test 8.4: HTTPS Required
**Test**: HTTP URL that redirects to HTTPS  
**Expected**: Handles redirect, tests HTTPS version

---

## Verification Checklist

After running tests, verify:

- [ ] All smoke tests pass
- [ ] At least 3 different game types tested
- [ ] Error scenarios handled gracefully
- [ ] Screenshots are valid and viewable
- [ ] Console logs are captured and filtered correctly
- [ ] S3 organization is correct (`{gameId}/{timestamp}/`)
- [ ] Presigned URLs work and expire after 24h
- [ ] No memory leaks or resource issues
- [ ] Browser sessions cleaned up properly
- [ ] All error messages are descriptive
- [ ] Test duration is reasonable (< 2 minutes for simple games)

---

## Troubleshooting Common Issues

### Issue: "No pages available"
**Cause**: Browser session not initialized  
**Fix**: Check Browserbase API key and project ID

### Issue: Screenshots are blank
**Cause**: Game hasn't loaded yet  
**Fix**: Increase wait time in game-loader.ts

### Issue: Console logs empty
**Cause**: No console events or filtering too aggressive  
**Fix**: Check browser console manually, verify filtering logic

### Issue: S3 upload fails
**Cause**: Invalid credentials or bucket name  
**Fix**: Verify AWS credentials and bucket exists

### Issue: Test hangs
**Cause**: Timeout not configured or too high  
**Fix**: Check `MAX_TEST_DURATION` and `BROWSERBASE_TIMEOUT`

---

## Success Criteria

**A successful test run should:**
- ✅ Complete without errors
- ✅ Return valid JSON response
- ✅ Include at least 1 screenshot
- ✅ Include console logs URL (if logs present)
- ✅ Have reasonable duration (< 2 min for simple games)
- ✅ Clean up browser session
- ✅ Upload artifacts to S3 correctly

---

**📖 Related**: See `docs/IMPLEMENTATION_TASKS.md` for development tasks, `docs/misc/SETUP_GUIDE.md` for environment setup.

