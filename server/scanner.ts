// ANTI-BOT DETECTION: Advanced framework to bypass Cloudflare/DataDome
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { createCursor } from 'ghost-cursor';
import { ScanResult, RequestLog } from '../types.js';
import { detectTagManagementSystems, extractDataLayers, setupDataLayerProxies, detectConsentManagementSystem, CMS_SIGNATURES, TMS_SIGNATURES } from './detectors.js';
import { calculateRiskScore, estimateFineRange } from './scoring.js';
import { detectTMSWithGemini } from './geminiTMSDetection.js';
import { detectDataLayersWithGemini } from './geminiDataLayerDetection.js';
import { detectDataLayersFromHTML, extractAnalyticsConfiguration } from './enhancedDetection.js';
import { 
  jitteredDelay, 
  humanActionDelay, 
  getRealisticUserAgent, 
  getRealisticHeaders,
  checkBotDetection,
  getNextProxy,
  type ProxyConfig
} from './antiBotUtils.js';
import { setupInPageNetworkMonitor, type InPageRequest } from './inPageNetworkMonitor.js';
import { setupServiceWorkerCapture, type ServiceWorkerRequest } from './serviceWorkerCapture.js';
import { setupScriptRewriting } from './scriptRewriter.js';
/**
 * Delay helper - replaces deprecated page.waitForTimeout()
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
  resourceType: string;
}

/**
 * Main scanner function - ANTI-BOT DETECTION FRAMEWORK
 * Uses Playwright with advanced stealth techniques to bypass Cloudflare/DataDome
 */
export async function scanWebsite(
  url: string, 
  options?: {
    proxyPool?: ProxyConfig[];
    skipBotCheck?: boolean;
  }
): Promise<ScanResult> {
  // CRITICAL: Fix URL normalization - handle typos and ensure valid protocol
  let targetUrl = url.trim();
  
  // Remove any leading/trailing whitespace
  targetUrl = targetUrl.trim();
  
  // Fix common typos in protocol
  targetUrl = targetUrl.replace(/^htps:\/\//i, 'https://');
  targetUrl = targetUrl.replace(/^http:\/\//i, 'https://'); // Prefer https
  
  // Check if it starts with a valid protocol
  if (!targetUrl.match(/^https?:\/\//i)) {
    // No valid protocol, prepend https://
    targetUrl = `https://${targetUrl}`;
  }
  
  // Remove duplicate protocols (can happen if user enters http://https://...)
  targetUrl = targetUrl.replace(/^(https?:\/\/)+/i, 'https://');
  
  // Remove trailing slashes for cleaner URLs
  targetUrl = targetUrl.replace(/\/+$/, '');
  
  console.log(`[SCAN] URL normalization: "${url}" -> "${targetUrl}"`);
  
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let inPageMonitor: { getRequests: () => InPageRequest[]; cleanup: () => void } | null = null;
  let swMonitor: { getRequests: () => ServiceWorkerRequest[]; cleanup: () => void } | null = null;
  
  try {
    // ANTI-BOT: Launch Playwright browser with anti-bot detection bypass
    console.log('[ANTI-BOT] Launching Playwright browser...');
    const proxy = getNextProxy(options?.proxyPool);
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: getRealisticUserAgent(),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: getRealisticHeaders(),
      proxy: proxy ? {
        server: `http://${proxy.host}:${proxy.port}`,
        username: proxy.username,
        password: proxy.password,
      } : undefined,
      javaScriptEnabled: true,
    });
    
    const page = await context.newPage();
    
    // FIX 1: CDP Override - Hide automation markers at protocol level
    try {
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
      console.log('[CDP] Automation markers hidden via CDP override');
    } catch (error: any) {
      console.warn('[CDP] CDP override failed (non-critical):', error.message);
    }
    
    // ITERATION 23: CRITICAL - Enable request interception to capture ALL requests
    // Standard listener may miss requests that are blocked/intercepted
    const allRequests: NetworkRequest[] = [];
    let consentClickTimestamp: number | null = null;
    let bannerExists = false;
    
    // ANTI-BOT: Set up in-page network monitoring
    inPageMonitor = await setupInPageNetworkMonitor(page);
    
    // NEW: Set up Service Worker capture (intercepts ALL fetch calls)
    try {
      swMonitor = await setupServiceWorkerCapture(page);
      console.log('[SW] Service Worker capture initialized');
    } catch (error: any) {
      console.warn('[SW] Service Worker setup failed (non-critical):', error.message);
    }
    
    // NEW: Set up script rewriting to inject data layer capture
    try {
      await setupScriptRewriting(page);
      console.log('[SCRIPT REWRITE] Script rewriting enabled');
    } catch (error: any) {
      console.warn('[SCRIPT REWRITE] Script rewriting setup failed (non-critical):', error.message);
    }
    
    console.log('[ANTI-BOT] Enabling Playwright request listeners...');
    page.on('request', (request) => {
      const url = request.url();
      const networkRequest: NetworkRequest = {
        url: url,
        method: request.method(),
        headers: request.headers(),
        postData: request.postData() || undefined,
        timestamp: Date.now(),
        resourceType: request.resourceType(),
      };
      allRequests.push(networkRequest);
      
      // Log Adobe requests immediately
      if (/adobe|omtrdc|2o7|adobedc|AppMeasurement|adobedtm|assets\.adobedtm/i.test(url)) {
        console.log(`[ANTI-BOT] ✓✓✓ CAPTURED Adobe request: ${request.resourceType()} ${url.substring(0, 200)}`);
      }
      
      // Log first 30 requests for debugging
      if (allRequests.length <= 30) {
        console.log(`[REQUEST] ${allRequests.length}. ${request.resourceType()}: ${url.substring(0, 120)}`);
      }
    });
    
    // Listen to console logs
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[DATA LAYER]')) {
        console.log(`[BROWSER] ${text}`);
      }
    });
    
    // ANTI-BOT: Remove automation indicators
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
    });
    
    // Set up data layer proxies BEFORE navigation
    await setupDataLayerProxies(page);
    
    console.log('[ANTI-BOT] Request listener set up. Starting navigation...');

    // ANTI-BOT: Navigate with human-like timing
    console.log(`[SCAN] Navigating to: ${targetUrl}`);
    const startTime = Date.now();
    
    await humanActionDelay();
    
    try {
      await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      console.log('[ANTI-BOT] Navigation completed');
      await jitteredDelay(1000, 0.3);
    } catch (error: any) {
      console.warn(`[ANTI-BOT] Navigation timeout: ${error.message}, trying load...`);
      try {
        await page.goto(targetUrl, {
          waitUntil: 'load',
          timeout: 30000,
        });
        console.log('[ANTI-BOT] Navigation completed with load');
      } catch (e: any) {
        console.warn(`[SCAN] Navigation warning: ${e.message}`);
      }
    }

    const navigationTime = Date.now() - startTime;
    console.log(`[SCAN] Navigation completed in ${navigationTime}ms. Captured ${allRequests.length} requests`);

    // CRITICAL: Wait for JavaScript objects to initialize (Adobe, GTM, etc.)
    console.log('[SCAN] Waiting for JavaScript objects to initialize...');
    await waitForJavaScriptObjects(page);
    
    // Check for banner AFTER objects are initialized
    bannerExists = await checkForBanner(page);
    console.log(`[SCAN] Banner found: ${bannerExists}`);

    // Get page content for detection (after load event)
    const pageContent = await page.content();

    // CRITICAL: Capture screenshot BEFORE consent (should show banner)
    const screenshotBefore = (await page.screenshot({ 
      type: 'png',
      fullPage: false 
    })) as Buffer;
    const screenshotBeforeBase64 = screenshotBefore.toString('base64');
    
    // DEBUG: Log requests captured BEFORE consent click
    console.log(`[DEBUG] Requests captured BEFORE consent click: ${allRequests.length}`);
    const preClickAdobe = allRequests.filter(r => /adobe|omtrdc|2o7|adobedc|AppMeasurement|adobedtm/i.test(r.url));
    console.log(`[DEBUG] Adobe requests BEFORE click: ${preClickAdobe.length}`);

    // FIX: Comprehensive consent click and wait logic
    if (bannerExists) {
      console.log('[BANNER] Attempting to click consent banner...');
      const clickResult = await tryClickConsentBanner(page);
      if (clickResult.clicked) {
        consentClickTimestamp = clickResult.timestamp;
        console.log(`[BANNER] Consent clicked at ${consentClickTimestamp}`);
        
        // FIX: Wait for banner to actually disappear before taking after screenshot
        console.log('[BANNER] Waiting for banner to disappear...');
        try {
          await page.waitForFunction(
            () => {
              const banner = document.querySelector('[id*="usercentrics"], [id*="consent"], [class*="uc-"], [class*="usercentrics"]');
              if (!banner) return true;
              const htmlEl = banner as HTMLElement;
              return htmlEl.offsetParent === null || 
                     htmlEl.style.display === 'none' ||
                     htmlEl.offsetWidth === 0 ||
                     htmlEl.offsetHeight === 0;
            },
            { timeout: 10000 }
          );
          console.log('[BANNER] Banner disappeared');
        } catch (e) {
          console.log('[BANNER] Banner may still be visible');
          await jitteredDelay(3000, 0.3); // Fallback wait with jitter
        }
        
        // ITERATION 14: Wait MUCH longer (20+ seconds) to capture ALL Adobe requests (screenshot shows many load after consent)
        console.log('[ITER14] Waiting 15s for Adobe scripts to load after consent (screenshot shows 20 Adobe requests)...');
        await delay(15000);
        
        // ITERATION 14: Additional wait for network activity to settle
        console.log('[ITER14] Waiting additional 5s for network activity...');
        await delay(5000);
        
        // ITERATION 16: Log all requests to see what we captured
        console.log(`[ITER16] Total requests captured: ${allRequests.length}`);
        const adobeRequestsAfter = allRequests.filter(r => /adobe|omtrdc|2o7|adobedc|AppMeasurement|adobedtm/i.test(r.url) && r.timestamp >= consentClickTimestamp);
        console.log(`[ITER16] Adobe requests after consent: ${adobeRequestsAfter.length}`);
        if (adobeRequestsAfter.length > 0) {
          console.log(`[ITER16] Adobe URLs:`, adobeRequestsAfter.slice(0, 10).map(r => r.url.substring(0, 150)));
        } else {
          console.log(`[ITER16] WARNING: No Adobe requests found after consent!`);
          // Log all request URLs for debugging
          console.log(`[ITER16] Sample request URLs:`, allRequests.slice(0, 20).map(r => r.url.substring(0, 100)));
        }
      } else {
        console.log('[ITER5] Banner exists but click failed');
      }
    } else {
      console.log('[ITER5] No banner found, skipping consent click');
    }

    // FIX: Capture screenshot AFTER consent (should NOT show banner if click worked)
    const screenshotAfter = (await page.screenshot({ 
      type: 'png',
      fullPage: false 
    })) as Buffer;
    const screenshotAfterBase64 = screenshotAfter.toString('base64');
    
    // DEBUG: Verify banner is gone in after screenshot
    if (bannerExists && consentClickTimestamp) {
      const bannerStillExists = await page.evaluate(() => {
        const banner = document.querySelector('[id*="usercentrics"], [id*="consent"], [class*="uc-"], [class*="usercentrics"]');
        if (!banner) return false;
        const htmlEl = banner as HTMLElement;
        return htmlEl.offsetParent !== null && 
               htmlEl.style.display !== 'none' &&
               htmlEl.offsetWidth > 0 &&
               htmlEl.offsetHeight > 0;
      });
      if (bannerStillExists) {
        console.log('[WARNING] Banner still visible after consent click!');
      } else {
        console.log('[SUCCESS] Banner successfully removed after consent click');
      }
    }

    // ITERATION 33: Check for Service Workers and Web Workers that might make requests
    console.log('[ITER33] Checking for Service Workers and Web Workers...');
    const workers = await page.evaluate(async () => {
      const workerInfo: any[] = [];
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        workerInfo.push({ type: 'serviceWorker', count: registrations.length });
      }
      // Check for Web Workers
      if (window.Worker) {
        // Can't easily enumerate active workers, but we can check if Worker API is available
        workerInfo.push({ type: 'webWorker', available: true });
      }
      return workerInfo;
    }).catch(() => []);
    console.log(`[ITER33] Workers detected:`, JSON.stringify(workers));
    
    // Extract script URLs and JavaScript context
    const [dynamicScriptUrls, jsContext] = await Promise.all([
      page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script[src]"));
        return scripts.map((s) => s.getAttribute("src") || "").filter(Boolean);
      }),
      extractJavaScriptContext(page),
    ]);

    console.log(`[SCAN] Found ${dynamicScriptUrls.length} script tags`);
    console.log(`[SCAN] JavaScript context: ${JSON.stringify(jsContext, null, 2)}`);

    // NEW: Check for data layers captured by script rewriting
    const capturedDataLayers = await page.evaluate(() => {
      const captured = (window as any).__consentCopDataLayers || {};
      const layerNames: string[] = [];
      Object.keys(captured).forEach(name => {
        if (captured[name]) {
          layerNames.push(name);
        }
      });
      return layerNames;
    }).catch(() => []);
    
    if (capturedDataLayers.length > 0) {
      console.log(`[SCRIPT REWRITE] Found data layers via script rewriting: ${capturedDataLayers.join(', ')}`);
    }
    
    // ANTI-BOT: Extract data layers with human-like timing
    let dataLayers = await extractDataLayers(page);
    
    // Merge captured data layers
    capturedDataLayers.forEach(layer => {
      if (!dataLayers.includes(layer)) {
        dataLayers.push(layer);
      }
    });
    
    // ANTI-BOT: If no data layers but objects exist, try multiple times with jittered delays
    if (dataLayers.length === 0 && (jsContext.adobeDetected || jsContext.gtmDetected)) {
      console.log('[ANTI-BOT] Objects detected but no data layers, retrying with human-like timing...');
      for (let attempt = 1; attempt <= 3; attempt++) {
        await jitteredDelay(2000 * attempt, 0.3); // Jittered increasing delay: ~2s, ~4s, ~6s
        const dataLayersRetry = await extractDataLayers(page);
        if (dataLayersRetry.length > 0) {
          console.log(`[ANTI-BOT] Found data layers on attempt ${attempt}: ${dataLayersRetry.join(', ')}`);
          dataLayers = dataLayersRetry;
          break;
        }
      }
    }

    // NEW: Merge Service Worker requests with Playwright requests
    if (swMonitor) {
      const swRequests = swMonitor.getRequests();
      console.log(`[SW] Service Worker captured ${swRequests.length} additional requests`);
      
      // Convert SW requests to NetworkRequest format and merge
      swRequests.forEach(swReq => {
        const networkReq: NetworkRequest = {
          url: swReq.url,
          method: swReq.method,
          headers: swReq.headers,
          postData: swReq.body,
          timestamp: swReq.timestamp,
          resourceType: 'xhr', // Service Workers typically intercept XHR/fetch
        };
        
        // Only add if not already captured
        if (!allRequests.find(r => r.url === swReq.url && Math.abs(r.timestamp - swReq.timestamp) < 1000)) {
          allRequests.push(networkReq);
          console.log(`[SW] ✓ Captured: ${swReq.method} ${swReq.url.substring(0, 100)}`);
        }
      });
    }
    
    // CRITICAL: Split requests correctly - if consent was NOT clicked, 
    // use a timestamp FAR in the future so all requests are "before"
    const splitTimestamp = consentClickTimestamp || Number.MAX_SAFE_INTEGER;
    const requestsBefore = allRequests.filter(r => r.timestamp < splitTimestamp);
    const requestsAfter = allRequests.filter(r => r.timestamp >= splitTimestamp);
    
    // DEBUG: Log Adobe requests BEFORE consent (these are violations!)
    const adobeBeforeConsent = requestsBefore.filter(r => /adobe|omtrdc|2o7|adobedc|AppMeasurement|adobedtm|assets\.adobedtm/i.test(r.url));
    console.log(`[CRITICAL] Adobe requests BEFORE consent (violations!): ${adobeBeforeConsent.length}`);
    if (adobeBeforeConsent.length > 0) {
      console.log(`[CRITICAL] Pre-consent Adobe URLs:`, adobeBeforeConsent.slice(0, 10).map(r => r.url.substring(0, 150)));
    }

    console.log('\n========== SCAN SUMMARY ==========');
    console.log(`[SUMMARY] Total requests captured: ${allRequests.length}`);
    console.log(`[SUMMARY] Consent clicked: ${consentClickTimestamp !== null ? 'YES' : 'NO'}`);
    if (consentClickTimestamp) {
      console.log(`[SUMMARY] Consent timestamp: ${consentClickTimestamp}`);
      console.log(`[SUMMARY] Requests before consent (timestamp < ${consentClickTimestamp}): ${requestsBefore.length}`);
      console.log(`[SUMMARY] Requests after consent (timestamp >= ${consentClickTimestamp}): ${requestsAfter.length}`);
    } else {
      console.log(`[SUMMARY] No consent clicked - all ${requestsBefore.length} requests marked as before`);
    }
    console.log(`[SUMMARY] Total scan time: ${Date.now() - startTime}ms`);

    // CRITICAL: Collect ALL URLs (before + after consent) for detection
    const allRequestUrls = allRequests.map(r => r.url);
    const allUrls = [...new Set([...allRequestUrls, ...dynamicScriptUrls])];
    console.log(`[DETECTION] Total URLs for detection: ${allUrls.length} (${allRequests.length} requests + ${dynamicScriptUrls.length} script tags)`);
    
    // CRITICAL: Log Adobe-related URLs - these should be captured BEFORE consent!
    const adobeUrls = allUrls.filter(u => /adobe|omtrdc|2o7|adobedc|adobedtm|AppMeasurement|assets\.adobedtm/i.test(u));
    console.log(`[CRITICAL] Adobe-related URLs in ALL requests: ${adobeUrls.length}`);
    if (adobeUrls.length > 0) {
      console.log(`[CRITICAL] ALL Adobe URLs found:`, adobeUrls.slice(0, 10).map(u => u.substring(0, 150)));
    } else {
      console.log(`[CRITICAL] WARNING: NO Adobe URLs found in ${allUrls.length} total URLs!`);
      console.log(`[CRITICAL] Sample URLs (first 20):`, allUrls.slice(0, 20).map(u => u.substring(0, 100)));
    }

    // Extract inline scripts ONCE (we'll reuse it multiple times)
    const inlineScriptsContent = await page.evaluate(() => {
      const inlineScripts = Array.from(document.querySelectorAll("script:not([src])"));
      return inlineScripts.map(s => s.textContent || s.innerHTML).join(' ');
    });

    // Detect CMP
    console.log('\n[DETECTION] Detecting CMP...');
    const cmsDetection = detectConsentManagementSystem(pageContent, allUrls);
    const bannerProvider = cmsDetection.primary === 'none' ? null : CMS_SIGNATURES[cmsDetection.primary]?.name || cmsDetection.primary;
    console.log(`[DETECTION] CMP detected: ${bannerProvider || 'none'} (confidence: ${cmsDetection.confidence})`);

        // ITERATION 26: CRITICAL - Check ALL sources for Adobe (page content, script tags, inline scripts)
        console.log('\n[ITER26] Comprehensive Adobe detection check...');
        // Enhanced patterns: include Adobe Client Data Layer patterns
        const adobeInContent = /assets\.adobedtm\.com|AppMeasurement|adobedtm|omtrdc|2o7|adobeDataLayer|_satellite|adobeLaunchScriptUrl|adobeAMCVId|adobeTargetToken|@adobe\/adobe-client-data-layer|Adobe Client Data Layer|ACDL/i.test(pageContent);
        const adobeInScripts = dynamicScriptUrls.some(url => /assets\.adobedtm\.com|AppMeasurement|adobedtm|omtrdc|2o7/i.test(url));
        const adobeInInlineScripts = /assets\.adobedtm\.com|AppMeasurement|adobedtm|omtrdc|2o7|adobeDataLayer|_satellite|adobeLaunchScriptUrl|adobeAMCVId|adobeTargetToken|@adobe\/adobe-client-data-layer|Adobe Client Data Layer/i.test(inlineScriptsContent);
        console.log(`[ITER26] Adobe in page content: ${adobeInContent}, Adobe in script tags: ${adobeInScripts}, Adobe in inline scripts: ${adobeInInlineScripts}`);
        
        // ITERATION 3: Detect TMS - pass ALL requests (before + after consent)
        console.log('\n[DETECTION] Detecting TMS...');
        console.log(`[ITER3] Passing ${allUrls.length} URLs, ${dataLayers.length} data layers to TMS detection`);
        const tmsDetection = detectTagManagementSystems(pageContent, allUrls, dataLayers);
        
        // ITERATION 26: Force detect Adobe if found in ANY source (content/scripts/inline)
        const adobeFound = adobeInContent || adobeInScripts || adobeInInlineScripts;
        if (adobeFound && !tmsDetection.detected.includes('adobe_launch') && !tmsDetection.detected.includes('aep_web_sdk')) {
          console.log('[ITER26] Force-adding Adobe Launch (found in page content/scripts/inline)');
          tmsDetection.detected.push('adobe_launch');
          tmsDetection.dataLayerNames.push('digitalData', '_satellite');
        }
        
    
    // Merge JavaScript context findings (removed duplicate)
    if (jsContext.adobeDetected && !tmsDetection.detected.includes('aep_web_sdk') && !tmsDetection.detected.includes('adobe_launch')) {
      console.log('[DETECTION] Adobe detected in JavaScript context - adding to detected TMS');
      if (jsContext.adobeType === 'aep') {
        tmsDetection.detected.push('aep_web_sdk');
        tmsDetection.dataLayerNames.push('adobeDataLayer');
      } else if (jsContext.adobeType === 'launch') {
        tmsDetection.detected.push('adobe_launch');
        tmsDetection.dataLayerNames.push('_satellite', 'digitalData');
      } else {
        tmsDetection.detected.push('adobe_launch');
      }
    }
    
    // CRITICAL FIX: Only add GTM if we see actual GTM container script (google_tag_manager object)
    // Don't add GTM just because dataLayer exists - dataLayer is used by many tools (Adobe Launch, Tealium, etc.)
    // Check if GTM is actually firing (has actual container script)
    const isGTMActuallyFiring = allUrls.some(url => /googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/i.test(url));
    if (jsContext.gtmDetected && !tmsDetection.detected.includes('gtm') && isGTMActuallyFiring) {
      console.log('[DETECTION] GTM detected in JavaScript context AND GTM container is firing - adding to detected TMS');
      tmsDetection.detected.push('gtm');
      tmsDetection.dataLayerNames.push('dataLayer');
    } else if (jsContext.gtmDetected && !isGTMActuallyFiring) {
      console.log('[DETECTION] ⚠ GTM patterns found (dataLayer/google_tag_manager) but GTM container not firing - skipping (likely false positive, dataLayer used by other tools like Adobe Launch)');
    }
    
    // GEMINI AI FALLBACK: If no TMS detected, use Gemini AI to analyze HTML/scripts
    let usingGeminiFallback = false;
    let geminiTMSResult: any = null;
    const initialTMSDetected = tmsDetection.detected.filter(tms => tms !== 'none');
    
    if (initialTMSDetected.length === 0) {
      console.log('\n[GEMINI FALLBACK] No TMS detected via standard methods. Using Gemini AI to analyze HTML/scripts...');
      usingGeminiFallback = true;
      
      // Call Gemini AI to analyze
      geminiTMSResult = await detectTMSWithGemini(pageContent, dynamicScriptUrls, inlineScriptsContent);
      
      if (geminiTMSResult.detectedTMS.length > 0) {
        console.log(`[GEMINI FALLBACK] Gemini detected TMS: ${geminiTMSResult.detectedTMS.join(', ')} (confidence: ${geminiTMSResult.confidence})`);
        // Map Gemini's TMS names to our internal types
        geminiTMSResult.detectedTMS.forEach((tmsName: string) => {
          const lowerName = tmsName.toLowerCase();
          if (lowerName.includes('adobe') && (lowerName.includes('launch') || lowerName.includes('experience platform launch'))) {
            if (!tmsDetection.detected.includes('adobe_launch')) {
              tmsDetection.detected.push('adobe_launch');
              tmsDetection.dataLayerNames.push('digitalData', '_satellite');
            }
          } else if (lowerName.includes('adobe') && (lowerName.includes('web sdk') || lowerName.includes('aep'))) {
            if (!tmsDetection.detected.includes('aep_web_sdk')) {
              tmsDetection.detected.push('aep_web_sdk');
              tmsDetection.dataLayerNames.push('adobeDataLayer');
            }
          } else if (lowerName.includes('google tag manager')) {
            if (!tmsDetection.detected.includes('gtm')) {
              tmsDetection.detected.push('gtm');
              tmsDetection.dataLayerNames.push('dataLayer');
            }
          }
        });
      } else {
        console.log('[GEMINI FALLBACK] Gemini AI found no TMS in page content');
      }
    }
    
    // GEMINI DATA LAYER FALLBACK: If no data layers detected, use Gemini AI to analyze HTML/scripts
    let geminiDataLayerResult: any = null;
    if (dataLayers.length === 0) {
      console.log('\n[GEMINI DATA LAYER FALLBACK] No data layers detected via standard methods. Using Gemini AI to analyze HTML/scripts...');
      geminiDataLayerResult = await detectDataLayersWithGemini(pageContent, dynamicScriptUrls, inlineScriptsContent);
      
      if (geminiDataLayerResult.detectedDataLayers.length > 0) {
        console.log(`[GEMINI DATA LAYER FALLBACK] Gemini detected data layers: ${geminiDataLayerResult.detectedDataLayers.join(', ')} (confidence: ${geminiDataLayerResult.confidence})`);
        dataLayers = geminiDataLayerResult.detectedDataLayers;
      } else {
        console.log('[GEMINI DATA LAYER FALLBACK] Gemini AI found no data layers in page content');
      }
    }
    
    let tmsDetected = tmsDetection.detected
      .filter(tms => tms !== 'none')
      .map(tms => TMS_SIGNATURES[tms]?.name || tms);
    
    console.log(`[DETECTION] TMS detected: ${tmsDetected.join(', ') || 'none'}`);
    if (tmsDetected.length > 0) {
      tmsDetection.detected.forEach(tms => {
        if (tms !== 'none') {
          const tmsName = TMS_SIGNATURES[tms]?.name || tms;
          console.log(`[DETECTION]   - ${tmsName}`);
        }
      });
    }

    // Process requests into RequestLog format
    const allRequestLogs = processRequests(requestsBefore, requestsAfter, bannerProvider);

    // Separate violations from compliant requests
    const violations = allRequestLogs.filter(r => r.status === 'violation');
    const compliant = allRequestLogs.filter(r => r.status === 'allowed');

    // Calculate risk score
    const riskScore = calculateRiskScore(
      violations,
      allRequestLogs.length,
      bannerProvider !== null
    );

    // Estimate fine range
    const fineRange = estimateFineRange(violations, riskScore);
    
    console.log(`Fine range: €${fineRange.min.toLocaleString()} - €${fineRange.max.toLocaleString()}`);

    // Build result
    const result: ScanResult = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      url: targetUrl,
      timestamp: new Date().toISOString(),
      riskScore,
      violationsCount: violations.length,
      compliantCount: compliant.length,
      consentBannerDetected: bannerProvider !== null,
      bannerProvider: bannerProvider || undefined,
      requests: allRequestLogs,
      screenshots: {
        before: `data:image/png;base64,${screenshotBeforeBase64}`,
        after: `data:image/png;base64,${screenshotAfterBase64}`,
      },
      dataLayers,
      tmsDetected,
      fineRange,
      scanMethod: usingGeminiFallback ? 'html_analysis' : 'network',
      scanNote: usingGeminiFallback 
        ? 'TMS detection via HTML/script analysis (network requests may be blocked by bot detection)' 
        : undefined,
      detectionDetails: {
        tmsEvidence: geminiTMSResult?.evidence || undefined,
        tmsDetectionSource: geminiTMSResult?.detectionSource || undefined,
        dataLayerEvidence: geminiDataLayerResult?.evidence || undefined,
        dataLayerDetectionSource: geminiDataLayerResult?.detectionSource || undefined,
        analyticsConfiguration: extractAnalyticsConfiguration(pageContent, inlineScriptsContent, dynamicScriptUrls),
      },
    };

    return result;
  } finally {
    // Cleanup
    if (inPageMonitor) {
      inPageMonitor.cleanup();
    }
    if (swMonitor) {
      swMonitor.cleanup();
    }
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * ANTI-BOT: Wait for JavaScript objects with human-like timing
 */
async function waitForJavaScriptObjects(page: Page): Promise<void> {
  try {
    // Try to wait for ANY TMS object with jittered timeout
    const found = await page.waitForFunction(
      () => {
        const w = window as any;
        return !!(w.dataLayer || w.adobeDataLayer || w._satellite || w.digitalData || 
                 w.s || w.google_tag_manager || w.adobe || w.utag_data);
      },
      { timeout: 10000 }
    );
    if (found) {
      console.log('[ANTI-BOT] JavaScript objects found');
      // Human-like delay after detection
      await jitteredDelay(500, 0.3);
    }
  } catch (e) {
    console.log('[ANTI-BOT] JavaScript objects wait timeout (scripts may load later)');
  }
}

/**
 * ANTI-BOT: Extract JavaScript execution context (works with Playwright)
 */
async function extractJavaScriptContext(page: Page): Promise<{
  adobeDetected: boolean;
  adobeType?: 'aep' | 'launch' | 'analytics';
  gtmDetected: boolean;
  windowObjects: string[];
}> {
  return await page.evaluate(() => {
    const windowAny = window as any;
    const windowObjects: string[] = [];
    let adobeDetected = false;
    let adobeType: 'aep' | 'launch' | 'analytics' | undefined;
    let gtmDetected = false;

    // Log all window keys for debugging
    const allWindowKeys = Object.keys(windowAny);
    const adobeKeys = allWindowKeys.filter(k => /adobe|satellite|alloy|omtrdc|digitalData/i.test(k));
    if (adobeKeys.length > 0) {
      console.log('[JS CONTEXT] Adobe-related window keys:', adobeKeys.slice(0, 20));
    }

    // Check for Adobe objects - more thorough
    if (windowAny.adobeDataLayer) {
      adobeDetected = true;
      adobeType = 'aep';
      windowObjects.push('adobeDataLayer');
    }
    if (windowAny.adobe?.alloy) {
      adobeDetected = true;
      adobeType = 'aep';
      windowObjects.push('adobe.alloy');
    }
    if (windowAny._satellite) {
      adobeDetected = true;
      if (!adobeType) adobeType = 'launch';
      windowObjects.push('_satellite');
    }
    if (windowAny.s || windowAny.s_gi || windowAny.s_code) {
      adobeDetected = true;
      if (!adobeType) adobeType = 'analytics';
      windowObjects.push('s', 's_gi', 's_code');
    }
    if (windowAny.digitalData) {
      adobeDetected = true;
      if (!adobeType) adobeType = 'launch';
      windowObjects.push('digitalData');
    }

    // Check for any window property containing adobe/satellite
    for (const key of adobeKeys) {
      if (typeof windowAny[key] === 'object' && windowAny[key] !== null) {
        adobeDetected = true;
        if (key.includes('satellite')) {
          adobeType = 'launch';
        } else if (!adobeType) {
          adobeType = 'aep';
        }
        if (!windowObjects.includes(key)) windowObjects.push(key);
      }
    }

    // Check for GTM
    if (windowAny.dataLayer) {
      gtmDetected = true;
      windowObjects.push('dataLayer');
    }
    if (windowAny.google_tag_manager) {
      gtmDetected = true;
      windowObjects.push('google_tag_manager');
    }

    // Check script content for patterns - more patterns
    const scripts = Array.from(document.querySelectorAll('script'));
    let adobeInScripts = false;
    for (const script of scripts) {
      const content = script.textContent || script.innerHTML || '';
      const src = script.getAttribute('src') || '';
      const fullContent = content + ' ' + src;
      
      if (/adobeDataLayer|alloy\.js|_satellite|omtrdc|2o7\.net|adobedtm|adobe\.com|adobeDataLayer/i.test(fullContent)) {
        adobeDetected = true;
        adobeInScripts = true;
        if (!adobeType) {
          adobeType = (fullContent.includes('alloy') || fullContent.includes('adobeDataLayer')) ? 'aep' : 'launch';
        }
      }
      if (/googletagmanager|dataLayer/i.test(fullContent) && !gtmDetected) {
        gtmDetected = true;
      }
    }
    
    if (adobeInScripts) {
      console.log('[JS CONTEXT] Adobe patterns found in script content');
    }

    return {
      adobeDetected,
      adobeType,
      gtmDetected,
      windowObjects,
    };
  });
}

/**
 * ITERATION 1: Improved banner detection - check more thoroughly
 */
async function checkForBanner(page: Page): Promise<boolean> {
  try {
    // Wait a bit for banner to potentially appear (human-like timing)
    await jitteredDelay(2000, 0.3);
    
    const found = await page.evaluate(() => {
      const selectors = [
        '[id*="usercentrics"]',
        '[class*="uc-"]',
        '[class*="usercentrics"]',
        '[id*="consent"]',
        '[class*="consent"]',
        '[id*="cookie"]',
        '[class*="cookie"]',
        '[id*="onetrust"]',
      ];
      
      // Check if any selector matches visible elements
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        for (const el of Array.from(elements)) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.offsetParent !== null || 
              htmlEl.style.display !== 'none' ||
              htmlEl.offsetWidth > 0 ||
              htmlEl.offsetHeight > 0) {
            return true; // Element is visible
          }
        }
      }
      
      // Check for Usercentrics script
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      if (scripts.some(s => /usercentrics/i.test(s.getAttribute('src') || ''))) {
        return true;
      }
      
      // Check page HTML content
      return /usercentrics|uc-|consent.*banner|cookie.*banner/i.test(document.body.innerHTML);
    });
    return found;
  } catch (e) {
    console.log(`[BANNER] Error checking banner: ${e}`);
    return false;
  }
}

/**
 * FIX 3: Try to click consent banner with improved detection
 */
async function tryClickConsentBanner(page: Page): Promise<{ clicked: boolean; timestamp: number }> {
  // CRITICAL: Get timestamp BEFORE clicking (for accurate request tracking)
  const clickTimestamp = Date.now();
  
  try {
    // Wait for banner to be fully loaded and interactive
    await page.waitForSelector('[id*="usercentrics"], [class*="uc-"], [class*="consent"], [id*="consent"]', {
      state: 'visible',
      timeout: 5000
    }).catch(() => {
      console.log('[BANNER] Banner selector not found, trying direct click...');
    });
    
    // Try multiple selectors in order of specificity
    const selectors = [
      'button[id*="uc-accept"]',
      'button[data-testid*="accept"]',
      '[id*="usercentrics"] button',
      'button:has-text("Alles akzeptieren")',
      'button:has-text("Accept all")',
      'button:has-text("Akzeptieren")',
      'button:has-text("Accept")',
    ];
    
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Try ghost-cursor first for human-like movement
          try {
            const cursor = createCursor(page as any);
            const box = await button.boundingBox();
            if (box) {
              await humanActionDelay();
              await cursor.moveTo({
                x: box.x + box.width / 2,
                y: box.y + box.height / 2,
              });
              await jitteredDelay(200, 0.4);
              await cursor.click();
              console.log(`[BANNER] ✓ Clicked with ghost-cursor: ${selector}`);
              return { clicked: true, timestamp: clickTimestamp };
            }
          } catch (cursorError) {
            // Fallback to regular click
          }
          
          // Regular Playwright click
          await button.click({ timeout: 2000 });
          console.log(`[BANNER] ✓ Clicked: ${selector}`);
          return { clicked: true, timestamp: clickTimestamp };
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: JavaScript click for buttons with text matching
    const clicked = await page.evaluate(() => {
      // ITERATION 13: Look for German "Alles akzeptieren" button (from screenshot)
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const acceptButton = buttons.find(btn => {
        const text = (btn.textContent || '').toLowerCase().trim();
        return (text.includes('alles akzeptieren') ||  // ITERATION 13: German "accept all"
                text.includes('accept all') ||
                text === 'alles akzeptieren' || 
                text.includes('akzeptieren') || 
                text.includes('alle akzeptieren') ||
                text.includes('alle zustimmen') ||
                text.includes('consent')) &&
               text.length < 50;
      });
      
      if (acceptButton && (acceptButton as HTMLElement).offsetParent !== null) {
        (acceptButton as HTMLElement).click();
        return true;
      }
      
      // Check for Usercentrics specific elements
      const ucElements = document.querySelectorAll('[id*="usercentrics"], [class*="uc-"], [class*="usercentrics"]');
      for (const el of Array.from(ucElements)) {
        const ucButtons = el.querySelectorAll('button');
        for (const btn of Array.from(ucButtons)) {
          const text = (btn.textContent || '').toLowerCase().trim();
          if ((text.includes('accept') || text.includes('akzeptieren')) && 
              (btn as HTMLElement).offsetParent !== null) {
            (btn as HTMLButtonElement).click();
            return true;
          }
        }
      }
      
      return false;
    });
    
    if (clicked) {
      console.log('[BANNER] ✓ Clicked via JavaScript fallback');
      return { clicked: true, timestamp: clickTimestamp };
    }
    
    console.log('[BANNER] ✗ No consent button found');
    return { clicked: false, timestamp: clickTimestamp };
  } catch (error: any) {
    console.log(`[BANNER] Error clicking: ${error.message}`);
    return { clicked: false, timestamp: clickTimestamp };
  }
}

/**
 * Process network requests into RequestLog format
 */
function processRequests(
  requestsBefore: NetworkRequest[],
  requestsAfter: NetworkRequest[],
  cmpProvider: string | null
): RequestLog[] {
  console.log(`[PROCESS] Processing ${requestsBefore.length} before + ${requestsAfter.length} after requests`);
  const requestLogs: RequestLog[] = [];
  const processedUrls = new Set<string>();
  let skippedCount = 0;
  let trackingCount = 0;

  // Process pre-consent requests (potential violations)
  requestsBefore.forEach((req, index) => {
    if (processedUrls.has(req.url)) return;
    processedUrls.add(req.url);

    try {
      const urlObj = new URL(req.url);
      const domain = urlObj.hostname;
      const isTracking = isTrackingRequest(req.url, domain);
      
      if (isTracking) {
        trackingCount++;
      }
      
      // Skip only the main document
      if (req.resourceType === 'document') {
        skippedCount++;
        return;
      }
      
      // Skip essential resources if not tracking
      if (isEssentialResource(req.url) && !isTracking) {
        skippedCount++;
        return;
      }

      // IMPROVED: Smarter violation detection
      // Not all pre-consent tracking requests are violations:
      // 1. CMP initialization scripts are allowed
      // 2. Strictly necessary cookies/scripts are allowed
      // 3. Only mark as violation if it's tracking AND collecting PII AND CMP is present
      const isCMPInitialization = isCMPRelatedRequest(req.url, cmpProvider);
      const isStrictlyNecessary = isStrictlyNecessaryRequest(req.url, domain);
      const hasPII = inferDataTypes(req.url, req.headers, req.postData).length > 0;
      
      // Violation = tracking request + has PII + CMP present + NOT CMP initialization + NOT strictly necessary
      const isViolation = isTracking && 
                         cmpProvider !== null && 
                         hasPII && 
                         !isCMPInitialization && 
                         !isStrictlyNecessary;

      requestLogs.push({
        id: `req_${index}`,
        domain,
        url: req.url,
        timestamp: req.timestamp,
        type: getRequestType(req.resourceType),
        status: isViolation ? 'violation' : 'allowed',
        dataTypes: inferDataTypes(req.url, req.headers, req.postData),
        parameters: extractParameters(req.url, req.postData),
      });
    } catch (error) {
      skippedCount++;
    }
  });
  
  console.log(`[PROCESS] Processed ${requestLogs.length} requests, skipped ${skippedCount}, found ${trackingCount} tracking requests`);

  // Process post-consent requests (should be allowed)
  requestsAfter.forEach((req, index) => {
    if (processedUrls.has(req.url)) return;
    processedUrls.add(req.url);

    try {
      const domain = new URL(req.url).hostname;
      
      if (req.resourceType === 'document' || isEssentialResource(req.url)) {
        return;
      }

      requestLogs.push({
        id: `req_after_${index}`,
        domain,
        url: req.url,
        timestamp: req.timestamp,
        type: getRequestType(req.resourceType),
        status: 'allowed',
        dataTypes: inferDataTypes(req.url, req.headers, req.postData),
        parameters: extractParameters(req.url, req.postData),
      });
    } catch (error) {
      // Skip invalid URLs
    }
  });

  return requestLogs;
}

/**
 * Check if a request is a tracking request
 */
// FIX 4: Improved tracking request detection with expanded patterns
function isTrackingRequest(url: string, domain: string): boolean {
  const urlLower = url.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // Extract base domain from URL for comparison
  let urlDomain = '';
  try {
    const urlObj = new URL(url);
    urlDomain = urlObj.hostname.replace(/^www\./, '');
  } catch {
    // Invalid URL, skip domain check
  }
  
  const trackingDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'googleadservices.com',
    'googlesyndication.com',
    'facebook.com',
    'facebook.net',
    'fbcdn.net',
    'adobe.com',
    'adobedtm.com',
    'omtrdc.net',
    '2o7.net',
    'adobedc.net',
    'edge.adobedc.net',
    'adobesc.com',
    'adobetagservices.com',
    'assets.adobedtm.com',
    'hotjar.com',
    'segment.io',
    'segment.com',
    'amplitude.com',
    'mixpanel.com',
    'heap.io',
    'fullstory.com',
    'mouseflow.com',
  ];

  // Check if URL domain matches tracking domains
  if (urlDomain && trackingDomains.some(td => urlDomain.includes(td.replace(/^www\./, '')))) {
    return true;
  }

  // FIX 4: Expanded tracking patterns
  const trackingPatterns = [
    // Adobe patterns (expanded)
    /adobe|omtrdc|2o7|adobedc|appmeasurement|adobedtm|assets\.adobedtm|edge\.adobedc|adobesc|adobetagservices/i,
    // Google patterns (expanded)
    /google-analytics|googletagmanager|doubleclick|googleadservices|googlesyndication|gtag|ga\.js|analytics\.js|gstatic\.com\/analytics/i,
    // Facebook patterns (expanded)
    /facebook\.com\/tr|fbcdn\.net|facebook\.net|fb\.com/i,
    // General tracking patterns (expanded)
    /analytics|tracking|pixel|beacon|track|collect|measure|telemetry/i,
    /pixel/i,
    /beacon/i,
    /collect/i,
    /gtm/i,
    /ga[^a-z]/i,
    /adobe/i,
    /omtr/i,
    /dtm/i,
    /omniture/i,
  ];

  const matchesDomain = trackingDomains.some(d => domainLower.includes(d));
  const matchesPattern = trackingPatterns.some(p => p.test(urlLower));
  
  return matchesDomain || matchesPattern;
}

/**
 * Check if resource is essential (not a violation)
 */
function isEssentialResource(url: string): boolean {
  const essentialPatterns = [
    /\.css$/i,
    /\.woff/i,
    /\.ttf/i,
    /\.eot/i,
    /fonts\./i,
    /font/i,
  ];

  return essentialPatterns.some(p => p.test(url));
}

/**
 * Check if request is CMP-related (CMP initialization scripts are allowed)
 */
function isCMPRelatedRequest(url: string, cmpProvider: string | null): boolean {
  if (!cmpProvider) return false;
  
  const cmpPatterns: Record<string, RegExp[]> = {
    'Usercentrics': [/usercentrics\.eu/i, /usercentrics\.com/i, /uc-/i, /UC_UI/i],
    'OneTrust': [/onetrust\.com/i, /optanon/i, /cookiepro/i],
    'Cookiebot': [/cookiebot\.com/i, /cookiebot/i],
    'CookieYes': [/cookieyes\.com/i, /cookieyes/i],
    'Quantcast': [/quantcast\.com/i, /quantserve\.com/i, /__tcfapi/i],
    'Didomi': [/didomi\.io/i, /didomi/i, /privacy-center\.org/i],
  };
  
  const patterns = cmpPatterns[cmpProvider] || [];
  return patterns.some(p => p.test(url));
}

/**
 * Check if request is strictly necessary (allowed without consent)
 */
function isStrictlyNecessaryRequest(url: string, domain: string): boolean {
  // First-party analytics that don't collect PII might be considered strictly necessary
  // But this is a gray area - we'll be conservative and only mark obvious cases
  
  // CDN, fonts, images, stylesheets are strictly necessary
  if (isEssentialResource(url)) return true;
  
  // First-party requests that are clearly functional (not tracking)
  const functionalPatterns = [
    /\/api\//i,
    /\/static\//i,
    /\/assets\//i,
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
  ];
  
  // Only if it's first-party (same domain or subdomain)
  const urlObj = new URL(url);
  const urlDomain = urlObj.hostname.replace(/^www\./, '');
  const baseDomain = domain.replace(/^www\./, '');
  const isFirstParty = urlDomain === baseDomain || urlDomain.endsWith(`.${baseDomain}`);
  
  return isFirstParty && functionalPatterns.some(p => p.test(url));
}

/**
 * Get request type from resource type
 */
function getRequestType(resourceType: string): 'pixel' | 'script' | 'xhr' {
  if (resourceType === 'script') return 'script';
  if (resourceType === 'xhr' || resourceType === 'fetch') return 'xhr';
  return 'pixel';
}

/**
 * Infer data types from request
 */
function inferDataTypes(
  url: string,
  headers: Record<string, string>,
  postData?: string
): string[] {
  const dataTypes: string[] = [];

  // Check URL parameters
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  
  if (urlParams.has('cid') || urlParams.has('client_id') || urlParams.has('visitor_id')) {
    dataTypes.push('Client ID');
  }
  
  if (urlParams.has('uid') || urlParams.has('user_id')) {
    dataTypes.push('User ID');
  }

  if (urlParams.has('email') || url.includes('email')) {
    dataTypes.push('Email');
  }

  if (urlParams.has('ip') || headers['x-forwarded-for']) {
    dataTypes.push('IP Address');
  }

  if (urlParams.has('page') || urlParams.has('pageName') || urlParams.has('dl')) {
    dataTypes.push('Page View');
  }

  if (urlParams.has('sr') || urlParams.has('screen')) {
    dataTypes.push('Screen Resolution');
  }

  if (urlParams.has('vp') || urlParams.has('viewport')) {
    dataTypes.push('Viewport Size');
  }

  if (url.includes('fingerprint') || url.includes('fp')) {
    dataTypes.push('Browser Fingerprint');
  }

  if (url.includes('behavior') || url.includes('session')) {
    dataTypes.push('Behavioral Tracking');
  }

  if (dataTypes.length === 0) {
    dataTypes.push('Tracking Data');
  }

  return dataTypes;
}

/**
 * Extract parameters from URL or POST data
 */
function extractParameters(url: string, postData?: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Extract from URL
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  urlParams.forEach((value, key) => {
    params[key] = value;
  });

  // Extract from POST data if available
  if (postData) {
    try {
      if (postData.startsWith('{')) {
        const json = JSON.parse(postData);
        Object.assign(params, json);
      } else {
        const postParams = new URLSearchParams(postData);
        postParams.forEach((value, key) => {
          params[key] = value;
        });
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  return params;
}
