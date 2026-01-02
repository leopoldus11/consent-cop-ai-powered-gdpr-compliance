# Anti-Bot Detection Framework Migration Guide

## Overview
This document outlines the migration from Puppeteer + Stealth to Playwright with advanced anti-bot detection techniques.

## Key Changes

### 1. Framework Switch: Puppeteer → Playwright
- **Why**: Playwright has better stealth capabilities and more realistic browser fingerprinting
- **Status**: Partially implemented - needs completion

### 2. New Dependencies Added
- `playwright`: Core browser automation framework
- `ghost-cursor`: Human-like mouse movements
- Already installed via `npm install playwright ghost-cursor`

### 3. New Utility Files Created
- `server/antiBotUtils.ts`: Jittered timing, bot detection checks, proxy rotation
- `server/inPageNetworkMonitor.ts`: In-page network monitoring (bypasses CDP)

### 4. API Differences to Fix

#### Browser Launch
**Puppeteer:**
```typescript
browser = await puppeteerExtra.launch({ headless: true });
const page = await browser.newPage();
```

**Playwright:**
```typescript
browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ /* fingerprint config */ });
const page = await context.newPage();
```

#### Request Interception
**Puppeteer:**
```typescript
await page.setRequestInterception(true);
page.on('request', (request) => {
  request.continue();
});
```

**Playwright:**
```typescript
// No setRequestInterception needed
page.on('request', (request) => {
  // Requests continue automatically
});
```

#### Screenshots
**Puppeteer:**
```typescript
const screenshot = await page.screenshot({ encoding: 'base64' }) as string;
```

**Playwright:**
```typescript
const screenshot = await page.screenshot({ type: 'png' }) as Buffer;
const base64 = screenshot.toString('base64');
```

#### Navigation
**Puppeteer:**
```typescript
await page.goto(url, { waitUntil: 'networkidle0' });
```

**Playwright:**
```typescript
await page.goto(url, { waitUntil: 'networkidle' });
```

#### Element Selection
**Puppeteer:**
```typescript
const button = await page.$(selector);
const isVisible = await button.isIntersectingViewport();
```

**Playwright:**
```typescript
const button = page.locator(selector).first();
const isVisible = await button.isVisible();
```

## Remaining Work

1. **Complete scanner.ts refactor** - Replace all Puppeteer APIs with Playwright equivalents
2. **Fix type errors** - Update all Page/Browser types to Playwright
3. **Update detectors.ts** - Ensure `setupDataLayerProxies` works with Playwright's `addInitScript`
4. **Test integration** - Verify all functionality works with Playwright

## Next Steps

1. Run `npm install` to ensure all dependencies are installed
2. Complete the scanner.ts refactor (see TODO comments in code)
3. Test with `dertour.de` to verify anti-bot detection bypass works
4. Monitor logs for `[ANTI-BOT]` prefixes to track new framework usage


