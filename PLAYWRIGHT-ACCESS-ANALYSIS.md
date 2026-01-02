# Playwright vs Puppeteer: Access Comparison

## Network Request Access

### **Puppeteer (Previous)**
- Uses `page.on('request')` listener
- Uses Chrome DevTools Protocol (CDP) under the hood
- Can intercept requests IF they fire
- **Limitation**: If bot detection blocks scripts, no requests fire = nothing to intercept

### **Playwright (Current)**
- Uses `page.on('request')` listener (same API)
- Uses CDP under the hood (same protocol)
- Can intercept requests IF they fire
- **Same Limitation**: If bot detection blocks scripts, no requests fire = nothing to intercept

**Verdict**: Playwright doesn't fundamentally improve network request access. Both frameworks have the same capabilities and limitations.

## Window Scope Access

### **Puppeteer (Previous)**
- `page.evaluate()` - runs JavaScript in page context
- `page.evaluateOnNewDocument()` - injects code before page load
- Can access `window` object if JavaScript executes
- **Limitation**: If scripts are blocked, objects never exist in `window`

### **Playwright (Current)**
- `page.evaluate()` - runs JavaScript in page context (same)
- `page.addInitScript()` - injects code before page load (equivalent)
- Can access `window` object if JavaScript executes
- **Same Limitation**: If scripts are blocked, objects never exist in `window`

**Verdict**: Window scope access is identical. Both can access `window` if scripts execute.

## What Playwright DOES Improve

1. **Better Stealth Options**: More built-in options to reduce detection
2. **Better Performance**: Generally faster execution
3. **Better API**: More modern, cleaner API design
4. **Better Cross-Browser**: Supports Firefox, WebKit (not just Chromium)

**BUT**: It doesn't fundamentally bypass advanced bot detection systems that block scripts from loading.

## The Real Problem

**If bot detection blocks scripts from loading:**
- No network requests fire → nothing to intercept
- No JavaScript objects initialize → `window.adobeDataLayer` doesn't exist
- **Neither Puppeteer nor Playwright can access what doesn't exist**

## Current Status

Looking at your logs:
- **80 requests captured** (before consent)
- **0 requests after consent** (this is suspicious - scripts should fire after consent)
- **0 tracking requests found** (this suggests Adobe requests aren't being captured)
- **Gemini detected `_satellite`** (found in HTML/scripts) but NOT `adobeDataLayer` (not in HTML, only in `window`)

**This suggests**:
1. Scripts ARE loading (we see 80 requests)
2. But Adobe tracking scripts may not be firing (0 tracking requests)
3. OR: Adobe scripts are firing but not being detected as "tracking"
4. `adobeDataLayer` object may exist in `window` but our detection logic isn't finding it

## Next Steps

1. **Add more logging** to `extractDataLayers()` to see what's actually in `window`
2. **Check if `adobeDataLayer` exists** but our detection logic has a bug
3. **Verify network requests** are actually being captured (maybe they're not matching our tracking patterns)


