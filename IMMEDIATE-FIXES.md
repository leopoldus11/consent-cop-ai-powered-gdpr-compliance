# Immediate Fixes (Next 2 Hours)

## Fix 1: CDP Override for Bot Detection

**File**: `server/scanner.ts`

Add after browser launch:
```typescript
// CDP Override - Hide automation markers
const client = await context.newCDPSession(page);
await client.send('Runtime.addBinding', { name: 'chrome' });
await client.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { 
      get: () => [1, 2, 3, 4, 5] 
    });
    Object.defineProperty(navigator, 'languages', { 
      get: () => ['en-US', 'en', 'de'] 
    });
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: async () => ({ state: 'granted' })
      })
    });
  `
});
```

---

## Fix 2: Fix In-Page Network Monitor Error

**File**: `server/inPageNetworkMonitor.ts`

The error "Execution context was destroyed" happens during navigation. Fix:
```typescript
const retrieveRequests = async () => {
  try {
    // Check if page is still valid
    if (page.isClosed()) {
      clearInterval(interval);
      return;
    }
    const pageRequests = await page.evaluate(() => {
      return (window as any).__inPageRequests || [];
    }).catch(() => []); // Return empty array on error
    
    // Merge new requests
    pageRequests.forEach((req: InPageRequest) => {
      if (!requests.find(r => r.url === req.url && r.timestamp === req.timestamp)) {
        requests.push(req);
      }
    });
  } catch (error) {
    // Silently fail during navigation
    if (!error.message.includes('Execution context was destroyed')) {
      console.warn('[IN-PAGE] Error retrieving requests:', error);
    }
  }
};
```

---

## Fix 3: Improve Banner Click Detection

**File**: `server/scanner.ts`

Add more selectors and wait for banner to be interactive:
```typescript
async function tryClickConsentBanner(page: Page): Promise<{ clicked: boolean; timestamp: number }> {
  const clickTimestamp = Date.now();
  
  try {
    // Wait for banner to be fully loaded and interactive
    await page.waitForSelector('[id*="usercentrics"], [class*="uc-"], [class*="consent"]', {
      state: 'visible',
      timeout: 5000
    });
    
    // Try multiple selectors in order
    const selectors = [
      'button[id*="uc-accept"]',
      'button[data-testid*="accept"]',
      '[id*="usercentrics"] button:has-text("Akzeptieren")',
      '[id*="usercentrics"] button:has-text("Accept")',
      'button:has-text("Alles akzeptieren")',
      'button:has-text("Accept all")',
    ];
    
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click({ timeout: 2000 });
          console.log(`[BANNER] ✓ Clicked: ${selector}`);
          return { clicked: true, timestamp: clickTimestamp };
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: JavaScript click
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const acceptButton = buttons.find(btn => {
        const text = (btn.textContent || '').toLowerCase().trim();
        return (text.includes('alles akzeptieren') || 
                text.includes('accept all') ||
                text.includes('akzeptieren')) &&
               text.length < 50;
      });
      
      if (acceptButton) {
        (acceptButton as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    return { clicked: clicked || false, timestamp: clickTimestamp };
  } catch (error: any) {
    console.log(`[BANNER] Error: ${error.message}`);
    return { clicked: false, timestamp: clickTimestamp };
  }
}
```

---

## Fix 4: Improve Tracking Request Detection

**File**: `server/scanner.ts`

The pattern matching is too strict. Expand patterns:
```typescript
function isTrackingRequest(url: string, domain: string): boolean {
  const trackingPatterns = [
    // Adobe
    /adobe|omtrdc|2o7|adobedc|AppMeasurement|adobedtm|assets\.adobedtm|edge\.adobedc/i,
    // Google
    /google-analytics|googletagmanager|doubleclick|googleadservices|googlesyndication/i,
    // Facebook
    /facebook\.com\/tr|fbcdn\.net|facebook\.net/i,
    // General tracking
    /analytics|tracking|pixel|beacon|track|collect|measure/i,
    // Third-party domains (not first-party)
    /^https?:\/\/(?!.*dertour\.de)/i, // Not dertour.de
  ];
  
  return trackingPatterns.some(pattern => pattern.test(url));
}
```

---

## Priority Order

1. **Fix 1 (CDP Override)** - 30 min - Highest impact
2. **Fix 2 (Network Monitor)** - 15 min - Prevents errors
3. **Fix 3 (Banner Click)** - 30 min - Critical for consent
4. **Fix 4 (Tracking Detection)** - 15 min - Improves accuracy

**Total Time**: ~90 minutes

**Expected Improvement**: 50-70% better detection


