# TMS Priority Fix: Adobe Launch vs GTM

## Problem
The scanner was incorrectly identifying **GTM (Google Tag Manager)** as the primary TMS for `dertour.de`, when in reality they use **Adobe Launch** as their TMS. The site may use `gtag` or `dataLayer` patterns (which can be used by other tools), but the actual TMS is Adobe Launch.

## Root Cause
The original priority logic had a flaw:
1. `isGTMActuallyFiring()` was checking for GTM container script, but the priority logic would still prioritize GTM if patterns were found
2. When both Adobe Launch and GTM patterns were detected, GTM was taking precedence even if Adobe Launch had stronger evidence (network requests)
3. `gtag`/`dataLayer` patterns can exist even when GTM is not the primary TMS (they might be used by Adobe or other tools)

## Solution

### 1. **Stricter GTM Detection**
- `isGTMActuallyFiring()` now only returns `true` if we see the actual GTM container script: `googletagmanager.com/gtm.js?id=GTM-XXXXX`
- This prevents false positives from `gtag`/`dataLayer` patterns used by other tools

### 2. **Adobe Launch Detection Function**
Added `isAdobeLaunchActuallyFiring()` function that checks for:
- Launch container script: `assets.adobedtm.com/*/launch-*.min.js`
- Adobe Analytics via Launch: `assets.adobedtm.com/*/AppMeasurement.min.js`
- Any JS from `assets.adobedtm.com` (Launch asset host)

### 3. **Evidence-Based Priority Logic**
New priority order:
1. **Priority 1**: If Adobe Launch is actually firing (network requests), it takes precedence
2. **Priority 2**: If GTM container is actually firing, it's the primary TMS
3. **Priority 3**: Evidence-based scoring (network requests > content patterns)
   - Network requests = score 3
   - Content patterns = score 1
   - Highest scoring TMS wins

### 4. **Evidence Tracking**
Added evidence tracking system that records how each TMS was detected:
- `network`: Detected via network requests (strongest evidence)
- `content`: Detected via page content patterns (weaker evidence)

## Code Changes

### `server/detectors.ts`

1. **Added `isAdobeLaunchActuallyFiring()` function** (lines 279-295)
   ```typescript
   function isAdobeLaunchActuallyFiring(requests: string[]): boolean {
     const launchPatterns = [
       /assets\.adobedtm\.com\/.*\/launch-[0-9a-f]{12}\.min\.js/i,
       /assets\.adobedtm\.com\/.*\/AppMeasurement\.min\.js/i,
       /assets\.adobedtm\.com.*\.js/i,
     ];
     return requests.some((url) => launchPatterns.some((pattern) => pattern.test(url)));
   }
   ```

2. **Updated priority logic** (lines 360-390)
   - Adobe Launch takes precedence if it's actually firing
   - Evidence-based scoring for tie-breakers
   - Better logging for debugging

## Expected Behavior

### Before Fix:
- `dertour.de` → Detected: `["gtm", "adobe_launch"]`, Primary: `"gtm"` ❌

### After Fix:
- `dertour.de` → Detected: `["gtm", "adobe_launch"]`, Primary: `"adobe_launch"` ✅

## Testing

1. Run a scan of `dertour.de`
2. Check logs for:
   - `[TMS DETECTION] Adobe Launch actually firing: true`
   - `[TMS DETECTION] Adobe Launch is firing (network requests detected), setting as primary TMS`
3. Verify that the primary TMS is `"adobe_launch"` in the scan result

## Next Steps

- Test the fix with `dertour.de`
- Monitor logs to ensure correct prioritization
- If issues persist, refine the pattern matching or evidence scoring


