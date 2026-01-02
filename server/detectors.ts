// CMP and TMS Detection Logic - Ported from Consent Cop v1

export type ConsentManagementSystem =
  | "onetrust"
  | "cookiebot"
  | "termly"
  | "iubenda"
  | "osano"
  | "trustarc"
  | "usercentrics"
  | "cookieyes"
  | "complianz"
  | "borlabs"
  | "quantcast"
  | "didomi"
  | "none";

export type TagManagementSystem =
  | "gtm"
  | "adobe_launch"
  | "aep_web_sdk"
  | "tealium"
  | "segment"
  | "onetrust"
  | "cookiebot"
  | "none";

export interface CMSDetectionResult {
  detected: ConsentManagementSystem[];
  primary: ConsentManagementSystem;
  confidence: "high" | "medium" | "low";
}

export interface TMSDetectionResult {
  detected: TagManagementSystem[];
  primary: TagManagementSystem;
  consentEvents: string[];
  dataLayerNames: string[];
  isGTMFiring: boolean;
}

// CMS Signatures from v1
export const CMS_SIGNATURES = {
  onetrust: {
    name: "OneTrust",
    vendor: "OneTrust LLC",
    patterns: [/onetrust/i, /optanon/i, /OneTrustActiveGroups/i, /cdn\.cookielaw\.org/i, /#onetrust-banner/i],
    docsUrl: "https://www.onetrust.com/products/cookie-consent/",
    description: "Enterprise consent management platform",
  },
  cookiebot: {
    name: "Cookiebot",
    vendor: "Cybot A/S",
    patterns: [/cookiebot/i, /consent\.cookiebot\.com/i, /CookiebotDialog/i, /Cookiebot\.consent/i],
    docsUrl: "https://www.cookiebot.com/",
    description: "GDPR/ePrivacy compliant cookie consent solution",
  },
  termly: {
    name: "Termly",
    vendor: "Termly Inc",
    patterns: [/termly\.io/i, /termly-code-snippet/i, /termly-consent/i],
    docsUrl: "https://termly.io/products/consent-management/",
    description: "Privacy policy and consent management",
  },
  iubenda: {
    name: "iubenda",
    vendor: "iubenda srl",
    patterns: [/iubenda\.com/i, /_iub_cs/i, /iubenda-cs/i],
    docsUrl: "https://www.iubenda.com/en/cookie-solution",
    description: "Compliance solutions for privacy and cookie law",
  },
  osano: {
    name: "Osano",
    vendor: "Osano Inc",
    patterns: [/osano\.com/i, /osano-cm/i],
    docsUrl: "https://www.osano.com/cookieconsent",
    description: "Data privacy platform with consent management",
  },
  trustarc: {
    name: "TrustArc",
    vendor: "TrustArc Inc",
    patterns: [/trustarc/i, /consent\.trustarc\.com/i, /truste/i],
    docsUrl: "https://trustarc.com/products/consent-management-platform/",
    description: "Enterprise privacy management platform",
  },
  usercentrics: {
    name: "Usercentrics",
    vendor: "Usercentrics GmbH",
    patterns: [/usercentrics/i, /app\.usercentrics\.eu/i, /app\.usercentrics\.com/i, /UC_UI/i, /uc-/i],
    docsUrl: "https://usercentrics.com/",
    description: "Consent Management Platform for GDPR compliance",
  },
  cookieyes: {
    name: "CookieYes",
    vendor: "CookieYes Limited",
    patterns: [/cookieyes/i, /cdn-cookieyes\.com/i],
    docsUrl: "https://www.cookieyes.com/",
    description: "Cookie consent solution for GDPR and CCPA",
  },
  complianz: {
    name: "Complianz",
    vendor: "Really Simple Plugins",
    patterns: [/complianz/i, /cmplz/i],
    docsUrl: "https://complianz.io/",
    description: "WordPress cookie consent plugin",
  },
  borlabs: {
    name: "Borlabs Cookie",
    vendor: "Borlabs GmbH",
    patterns: [/borlabs/i, /BorlabsCookie/i],
    docsUrl: "https://borlabs.io/borlabs-cookie/",
    description: "WordPress GDPR cookie consent plugin",
  },
  quantcast: {
    name: "Quantcast Choice",
    vendor: "Quantcast Inc",
    patterns: [/quantcast/i, /quantserve\.com/i, /__tcfapi/i],
    docsUrl: "https://www.quantcast.com/products/choice-consent-management-platform/",
    description: "IAB TCF 2.0 compliant CMP",
  },
  didomi: {
    name: "Didomi",
    vendor: "Didomi SAS",
    patterns: [/didomi/i, /sdk\.privacy-center\.org/i],
    docsUrl: "https://www.didomi.io/",
    description: "Consent and preference management platform",
  },
};

// TMS Signatures from v1
export const TMS_SIGNATURES = {
  gtm: {
    name: "Google Tag Manager",
    // CRITICAL: Only detect GTM if we see actual GTM container script or google_tag_manager object
    // DO NOT use /window\.dataLayer/i - dataLayer is used by many tools, not just GTM!
    // Adobe Launch, Tealium, and others also use dataLayer
    patterns: [/googletagmanager\.com\/gtm\.js/i, /google_tag_manager/i],
    dataLayerNames: ["dataLayer"],
    consentEvents: ["consent_update", "gtm.init_consent", "cookie_consent"],
    description: "Google Tag Manager with GTM Consent Mode",
  },
  adobe_launch: {
    name: "Adobe Launch",
    // ITERATION 11: CRITICAL - assets.adobedtm.com is the KEY pattern from screenshot
    patterns: [
      /assets\.adobedtm\.com/i,  // CRITICAL: This is what appears in the screenshot!
      /_satellite/i, 
      /adobe\.target/i, 
      /adobedtm\.com/i, 
      /adobedtm\.net/i, 
      /omtrdc\.net/i, 
      /2o7\.net/i,
      /AppMeasurement/i,  // ITERATION 12: Adobe Analytics AppMeasurement
      /adobe-client-data-layer/i,  // ITERATION 15: From screenshot
    ],
    dataLayerNames: ["digitalData", "_satellite"],
    consentEvents: ["adobe_consent_update", "consent_update", "optanonwrapper"],
    description: "Adobe Experience Platform Launch",
  },
  aep_web_sdk: {
    name: "Adobe Experience Platform Web SDK",
    patterns: [/alloy\.js/i, /adobe\.com.*alloy/i, /window\.alloy/i, /adobedc\.net/i, /omtrdc\.net/i, /2o7\.net/i, /adobedtm\.com/i, /adobedtm\.net/i, /edge\.adobedc\.net/i, /experience\.adobe\.net/i, /adobedc\.com/i],
    dataLayerNames: ["adobeDataLayer"],
    consentEvents: ["consent:update", "setConsent"],
    description: "Adobe Experience Platform Web SDK (Alloy)",
  },
  tealium: {
    name: "Tealium",
    patterns: [/tags\.tiqcdn\.com/i, /tealium/i, /utag\.js/i],
    dataLayerNames: ["utag_data", "b"],
    consentEvents: ["consent_update", "utag_consent_update"],
    description: "Tealium IQ Tag Management",
  },
  segment: {
    name: "Segment",
    patterns: [/cdn\.segment\.com/i, /analytics\.js/i, /window\.analytics/i],
    dataLayerNames: ["analytics"],
    consentEvents: ["consent_updated", "Segment Consent Preference Updated"],
    description: "Segment (Twilio)",
  },
  onetrust: {
    name: "OneTrust",
    patterns: [/onetrust/i, /optanon/i],
    dataLayerNames: ["dataLayer", "OnetrustActiveGroups"],
    consentEvents: ["OneTrustGroupsUpdated", "OptanonWrapper"],
    description: "OneTrust Consent Management Platform",
  },
  cookiebot: {
    name: "Cookiebot",
    patterns: [/cookiebot/i, /consent\.cookiebot\.com/i],
    dataLayerNames: ["dataLayer"],
    consentEvents: ["CookiebotOnAccept", "CookiebotOnDecline"],
    description: "Cookiebot Consent Management",
  },
};

/**
 * Detect Consent Management System (CMP) - from v1
 */
export function detectConsentManagementSystem(
  pageContent: string,
  requestUrls: string[]
): CMSDetectionResult {
  console.log('[CMP DETECTION] Starting CMP detection...');
  console.log(`[CMP DETECTION] Checking ${requestUrls.length} requests and page content (${pageContent.length} chars)`);
  
  const detected: ConsentManagementSystem[] = [];
  const scores: Record<string, number> = {};

  Object.entries(CMS_SIGNATURES).forEach(([key, config]) => {
    let score = 0;

    // Check page content
    config.patterns.forEach((pattern) => {
      if (pattern.test(pageContent)) {
        score += 2;
        console.log(`[CMP DETECTION] Pattern match in content: ${pattern} for ${key}`);
      }
    });

    // Check network requests
    requestUrls.forEach((url) => {
      config.patterns.forEach((pattern) => {
        if (pattern.test(url)) {
          score += 3; // Higher weight for network requests
          console.log(`[CMP DETECTION] Pattern match in request: ${pattern} for ${key} in ${url.substring(0, 100)}`);
        }
      });
    });

    if (score > 0) {
      detected.push(key as ConsentManagementSystem);
      scores[key] = score;
      console.log(`[CMP DETECTION] ${key} detected with score: ${score}`);
    }
  });

  if (detected.length === 0) {
    console.log('[CMP DETECTION] No CMS detected');
    return {
      detected: ["none"],
      primary: "none",
      confidence: "high",
    };
  }

  // Sort by score to find primary CMS
  const sortedDetected = detected.sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  const primaryScore = scores[sortedDetected[0]] || 0;

  let confidence: "high" | "medium" | "low" = "medium";
  if (primaryScore >= 5) confidence = "high";
  else if (primaryScore >= 3) confidence = "medium";
  else confidence = "low";

  console.log(`[CMP DETECTION] Primary CMS: ${sortedDetected[0]} (confidence: ${confidence}, score: ${primaryScore})`);

  return {
    detected: sortedDetected,
    primary: sortedDetected[0],
    confidence,
  };
}

/**
 * Check if GTM is actually firing (has active network requests)
 */
/**
 * Check if GTM container is actually firing (strict check)
 * Only returns true if we see the actual GTM container script URL
 * NOT just dataLayer or gtag patterns (which can be used by other tools)
 */
function isGTMActuallyFiring(requests: string[]): boolean {
  // Strict check: Only return true if we see the actual GTM container script
  // Pattern: googletagmanager.com/gtm.js?id=GTM-XXXXX
  const gtmPattern = /googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/i;
  const isFiring = requests.some((url) => gtmPattern.test(url));
  console.log(`[TMS DETECTION] GTM firing check: ${isFiring}`);
  return isFiring;
}

/**
 * Check if Adobe Launch is actually firing (strong evidence)
 * Returns true if we see Adobe Launch container script or Adobe DTM assets
 */
function isAdobeLaunchActuallyFiring(requests: string[]): boolean {
  // Strong indicators of Adobe Launch:
  // 1. assets.adobedtm.com/*/launch-*.min.js (Launch container)
  // 2. assets.adobedtm.com with AppMeasurement.js (Adobe Analytics via Launch)
  const launchPatterns = [
    /assets\.adobedtm\.com\/.*\/launch-[0-9a-f]{12}\.min\.js/i, // Launch container script
    /assets\.adobedtm\.com\/.*\/AppMeasurement\.min\.js/i, // Adobe Analytics via Launch
    /assets\.adobedtm\.com.*\.js/i, // Any JS from assets.adobedtm.com (Launch asset host)
  ];
  const isFiring = requests.some((url) => launchPatterns.some((pattern) => pattern.test(url)));
  console.log(`[TMS DETECTION] Adobe Launch firing check: ${isFiring}`);
  return isFiring;
}

/**
 * Detect Tag Management System (TMS) - from v1
 */
export function detectTagManagementSystems(
  pageContent: string,
  requests: string[],
  dataLayers: string[]
): TMSDetectionResult {
  console.log('[TMS DETECTION] Starting TMS detection...');
  console.log(`[TMS DETECTION] Checking ${requests.length} requests, ${dataLayers.length} data layers, and page content`);
  
  const detected: TagManagementSystem[] = [];
  const consentEvents: string[] = [];
  const dataLayerNames: string[] = [];

  // IMPROVED: Check actual firing status with strict patterns
  const isGTMFiring = isGTMActuallyFiring(requests);
  const isAdobeLaunchFiring = isAdobeLaunchActuallyFiring(requests);

  console.log(`[TMS DETECTION] GTM actually firing: ${isGTMFiring}, Adobe Launch actually firing: ${isAdobeLaunchFiring}`);

  // ITERATION 17-19: More comprehensive Adobe domain detection (from screenshot)
  const adobeDomainPatterns = [
    /assets\.adobedtm\.com/i,  // ITERATION 17: CRITICAL from screenshot!
    /\.omtrdc\.net/i, /\.2o7\.net/i, /adobedc\.net/i, /adobedc\.com/i, 
    /adobedtm\.com/i, /adobedtm\.net/i, /edge\.adobedc\.net/i,
    /dertour\.de\.omtrdc\.net/i, /dertour\.de\.2o7\.net/i,  // Site-specific patterns
    /\.sc\.omtrdc\.net/i, /\.sc\.2o7\.net/i,  // Adobe SC domains
    /AppMeasurement/i,  // ITERATION 17: Adobe Analytics from screenshot
    /adobe-client-data-layer/i,  // ITERATION 19: From screenshot
  ];
  const hasAdobeDomain = requests.some(url => adobeDomainPatterns.some(p => p.test(url)));
  if (hasAdobeDomain) {
    console.log('[ITER10] ✓ Adobe domain detected in requests');
    const matchingUrls = requests.filter(url => adobeDomainPatterns.some(p => p.test(url)));
    console.log(`[ITER10] Matching URLs: ${matchingUrls.length}`, matchingUrls.slice(0, 3).map(u => u.substring(0, 100)));
  }

  // Evidence scoring: track how each TMS was detected (network requests > script tags > page content)
  type EvidenceStrength = 'network' | 'script' | 'content';
  const tmsEvidence: Map<TagManagementSystem, EvidenceStrength[]> = new Map();

  // Check page content and network requests for TMS signatures
  Object.entries(TMS_SIGNATURES).forEach(([key, config]) => {
    const matchesContent = config.patterns.some((pattern) => pattern.test(pageContent));
    const matchesRequests = requests.some((url) => config.patterns.some((pattern) => pattern.test(url)));
    
    // ITERATION 2: For Adobe, also check domain patterns
    const matchesAdobeDomain = (key === 'adobe_launch' || key === 'aep_web_sdk') && hasAdobeDomain;
    
    // CRITICAL FIX: For GTM, only detect if we see actual GTM container script (network requests)
    // Don't detect GTM just from content patterns if Adobe Launch is firing, because:
    // - dataLayer is used by many tools, not just GTM
    // - If Adobe Launch is firing, it's the actual TMS, even if gtag/dataLayer patterns exist
    const isGTM = key === 'gtm';
    const shouldDetectGTM = isGTM ? (matchesRequests && isGTMFiring) : true; // GTM requires actual firing, others don't
    
    // Track evidence strength
    const evidence: EvidenceStrength[] = [];
    if (matchesRequests || matchesAdobeDomain) {
      evidence.push('network');
    }
    // Note: We don't separately track script tags here, but we could if needed
    if (matchesContent) {
      evidence.push('content');
    }

    if ((matchesContent || matchesRequests || matchesAdobeDomain) && shouldDetectGTM) {
      const tms = key as TagManagementSystem;
      detected.push(tms);
      tmsEvidence.set(tms, evidence);
      consentEvents.push(...config.consentEvents);
      dataLayerNames.push(...config.dataLayerNames);
      console.log(`[TMS DETECTION] ✓ ${config.name} detected (content: ${matchesContent}, requests: ${matchesRequests}, domain: ${matchesAdobeDomain}, evidence: ${evidence.join(', ')})`);
      
      if (matchesRequests || matchesAdobeDomain) {
        // Log which request matched
        const matchingRequest = requests.find((url) => 
          config.patterns.some((pattern) => pattern.test(url)) || adobeDomainPatterns.some((p) => p.test(url))
        );
        if (matchingRequest) {
          console.log(`[TMS DETECTION]   Matched request: ${matchingRequest.substring(0, 150)}`);
        }
      }
    } else if (isGTM && !shouldDetectGTM) {
      console.log(`[TMS DETECTION] ⚠ GTM patterns found but GTM container not firing - skipping (likely false positive, dataLayer used by other tools)`);
    }
  });

  // IMPROVED PRIORITY LOGIC: Evidence-based prioritization
  let primary: TagManagementSystem;

  // Priority 1: If Adobe Launch is actually firing (network requests), it takes precedence
  // Adobe Launch is the actual TMS, even if gtag/dataLayer patterns are present (which might be used by other tools)
  if (isAdobeLaunchFiring && detected.includes('adobe_launch')) {
    primary = "adobe_launch";
    console.log('[TMS DETECTION] Adobe Launch is firing (network requests detected), setting as primary TMS');
  }
  // Priority 2: If GTM container is actually firing, it's the primary TMS
  else if (isGTMFiring && detected.includes('gtm')) {
    primary = "gtm";
    console.log('[TMS DETECTION] GTM container is firing (network requests detected), setting as primary TMS');
  }
  // Priority 3: Evidence-based priority (network requests > content patterns)
  else {
    // Score each detected TMS by evidence strength
    const scoredTMS = Array.from(detected)
      .map(tms => {
        const evidence = tmsEvidence.get(tms) || [];
        // Network requests = strongest evidence (score 3), content = weaker (score 1)
        const score = evidence.filter(e => e === 'network').length * 3 + 
                     evidence.filter(e => e === 'content').length * 1;
        return { tms, score, evidence };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    console.log(`[TMS DETECTION] Evidence scores:`, scoredTMS.map(s => `${s.tms}: ${s.score} (${s.evidence.join(', ')})`).join(', '));

    // If we have scored TMS, use the highest scoring one
    if (scoredTMS.length > 0 && scoredTMS[0].score > 0) {
      primary = scoredTMS[0].tms;
      console.log(`[TMS DETECTION] Primary TMS (by evidence score): ${primary} (score: ${scoredTMS[0].score})`);
    } else {
      // Fallback: Use priority order
      const priority: TagManagementSystem[] = ["adobe_launch", "aep_web_sdk", "tealium", "segment", "gtm"];
      primary = priority.find((tms) => detected.includes(tms)) || detected[0] || "none";
      console.log(`[TMS DETECTION] Primary TMS (by priority fallback): ${primary}`);
    }
  }

  if (detected.length === 0) {
    console.log('[TMS DETECTION] No TMS detected');
  }

  return {
    detected: detected.length > 0 ? detected : ["none"],
    primary,
    consentEvents: [...new Set(consentEvents)],
    dataLayerNames: [...new Set(dataLayerNames)],
    isGTMFiring,
  };
}

/**
 * Extract data layers from page using Proxy-based interception (from v1)
 * This should be called after the page has loaded and proxies have been set up
 */
export async function extractDataLayers(page: any): Promise<string[]> {
  console.log('[DATA LAYER] Starting data layer extraction...');
  const dataLayers: string[] = [];

  try {
    // Wait a bit for data layers to be initialized (human-like timing)
    const jitteredDelay = 2000 + Math.random() * 1000 - 500; // 1500-2500ms
    await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    
    // Check for common data layer patterns
    const dataLayerCheck = await page.evaluate(() => {
      const layers: string[] = [];
      const windowAny = window as any;
      
      console.log('[DATA LAYER] Checking window objects...');
      
      // DEBUG: Log ALL window keys to see what's available
      const allKeys = Object.keys(windowAny);
      const adobeKeys = allKeys.filter(k => /adobe|satellite|alloy|omtrdc|digitalData/i.test(k));
      console.log(`[DATA LAYER DEBUG] Total window keys: ${allKeys.length}`);
      console.log(`[DATA LAYER DEBUG] Adobe-related keys: ${adobeKeys.slice(0, 20).join(', ')}`);
      
      // DEBUG: Check adobeDataLayer specifically
      if ('adobeDataLayer' in windowAny) {
        console.log(`[DATA LAYER DEBUG] adobeDataLayer EXISTS in window`);
        console.log(`[DATA LAYER DEBUG] adobeDataLayer type: ${typeof windowAny.adobeDataLayer}`);
        console.log(`[DATA LAYER DEBUG] adobeDataLayer value:`, windowAny.adobeDataLayer);
        if (Array.isArray(windowAny.adobeDataLayer)) {
          console.log(`[DATA LAYER DEBUG] adobeDataLayer is array with length: ${windowAny.adobeDataLayer.length}`);
        }
      } else {
        console.log(`[DATA LAYER DEBUG] adobeDataLayer DOES NOT EXIST in window`);
      }
      
      // Check window.dataLayer (Google Tag Manager)
      if (typeof windowAny.dataLayer !== 'undefined' && windowAny.dataLayer) {
        const originalLayer = windowAny._original_dataLayer;
        const layer = originalLayer && Array.isArray(originalLayer) ? originalLayer : windowAny.dataLayer;
        if (Array.isArray(layer) && layer.length > 0) {
          console.log(`[DATA LAYER] Found: dataLayer (${layer.length} items)`);
          layers.push('dataLayer');
        } else if (windowAny.dataLayer) {
          console.log('[DATA LAYER] Found: dataLayer (exists but empty)');
          layers.push('dataLayer');
        }
      }
      
      // FIX: Check adobeDataLayer (Adobe Experience Platform) - improved detection
      if (typeof windowAny.adobeDataLayer !== 'undefined') {
        console.log('[DATA LAYER DEBUG] adobeDataLayer check: typeof check passed');
        const originalLayer = windowAny._original_adobeDataLayer;
        const layer = originalLayer || windowAny.adobeDataLayer;
        console.log(`[DATA LAYER DEBUG] layer value:`, layer);
        console.log(`[DATA LAYER DEBUG] layer type: ${typeof layer}, isArray: ${Array.isArray(layer)}, isNull: ${layer === null}, isUndefined: ${layer === undefined}`);
        // Check if it exists (even if empty array or object)
        if (layer !== null && layer !== undefined) {
          if (Array.isArray(layer) && layer.length > 0) {
            console.log(`[DATA LAYER] Found: adobeDataLayer (${layer.length} items)`);
            layers.push('adobeDataLayer');
          } else if (Array.isArray(layer)) {
            console.log('[DATA LAYER] Found: adobeDataLayer (empty array)');
            layers.push('adobeDataLayer');
          } else if (typeof layer === 'object') {
            console.log('[DATA LAYER] Found: adobeDataLayer (object)');
            layers.push('adobeDataLayer');
          } else {
            console.log('[DATA LAYER] Found: adobeDataLayer (exists)');
            layers.push('adobeDataLayer');
          }
        } else {
          console.log('[DATA LAYER DEBUG] adobeDataLayer check: layer is null or undefined');
        }
      } else {
        console.log('[DATA LAYER DEBUG] adobeDataLayer check: typeof check FAILED (undefined)');
      }
      
      // Check digitalData (Adobe Analytics)
      if (typeof windowAny.digitalData !== 'undefined' && windowAny.digitalData) {
        const originalLayer = windowAny._original_digitalData;
        const layer = originalLayer || windowAny.digitalData;
        if (layer && typeof layer === 'object') {
          console.log('[DATA LAYER] Found: digitalData');
          layers.push('digitalData');
        }
      }
      
      // Check for _satellite (Adobe Launch)
      if (typeof windowAny._satellite !== 'undefined') {
        console.log('[DATA LAYER] Found: _satellite (Adobe Launch)');
        layers.push('_satellite');
      }
      
      // Check utag_data (Tealium)
      if (typeof windowAny.utag_data !== 'undefined' && windowAny.utag_data) {
        console.log('[DATA LAYER] Found: utag_data');
        layers.push('utag_data');
      }
      
      // Check for any additional adobe-related objects (different filter than debug check above)
      const additionalAdobeKeys = Object.keys(windowAny).filter(key => {
        const keyLower = key.toLowerCase();
        return (keyLower.includes('adobe') || 
                keyLower.includes('omniture') ||
                keyLower.includes('dtm') ||
                keyLower.includes('satellite') ||
                keyLower.includes('alloy')) && 
               typeof windowAny[key] === 'object' &&
               windowAny[key] !== null;
      });
      if (additionalAdobeKeys.length > 0) {
        console.log(`[DATA LAYER] Found additional Adobe-related keys: ${additionalAdobeKeys.join(', ')}`);
        additionalAdobeKeys.forEach(key => {
          if (!layers.includes(key)) layers.push(key);
        });
      }

      return layers;
    });

    dataLayers.push(...dataLayerCheck);
    console.log(`[DATA LAYER] Total data layers found: ${dataLayers.length}`);
    console.log(`[DATA LAYER] Data layers: ${dataLayers.join(', ') || 'none'}`);
    
    // If still no data layers, try checking after a longer wait
    if (dataLayers.length === 0) {
      console.log('[DATA LAYER] No data layers found, waiting longer and checking again...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const secondCheck = await page.evaluate(() => {
        const layers: string[] = [];
        const windowAny = window as any;
        
        // Check all common patterns again
        if (windowAny.dataLayer) {
          const originalLayer = windowAny._original_dataLayer;
          const layer = originalLayer && Array.isArray(originalLayer) ? originalLayer : windowAny.dataLayer;
          if (Array.isArray(layer) && layer.length > 0) layers.push('dataLayer');
        }
        if (windowAny.adobeDataLayer) {
          const originalLayer = windowAny._original_adobeDataLayer;
          const layer = originalLayer && Array.isArray(originalLayer) ? originalLayer : windowAny.adobeDataLayer;
          if (Array.isArray(layer) && layer.length > 0) layers.push('adobeDataLayer');
        }
        if (windowAny.digitalData) layers.push('digitalData');
        if (windowAny._satellite) layers.push('_satellite');
        if (windowAny.utag_data) layers.push('utag_data');
        
        return layers;
      });
      
      if (secondCheck.length > 0) {
        console.log(`[DATA LAYER] Found data layers on second check: ${secondCheck.join(', ')}`);
        dataLayers.push(...secondCheck.filter(l => !dataLayers.includes(l)));
      }
    }
  } catch (error) {
    console.warn('[DATA LAYER] Error extracting data layers:', error);
  }

  return dataLayers;
}

/**
 * Set up Proxy-based data layer interception (from v1)
 * This must be called BEFORE page navigation
 */
export async function setupDataLayerProxies(page: any): Promise<void> {
  console.log('[DATA LAYER] Setting up Proxy-based interception...');
  
  // Use addInitScript for Playwright, evaluateOnNewDocument for Puppeteer
  if (typeof page.addInitScript === 'function') {
    await page.addInitScript(() => {
    const createDataLayerProxy = (name: string) => {
      const windowAny = window as any;
      const originalLayer = windowAny[name] || [];
      
      // Store original layer before proxying
      windowAny[`_original_${name}`] = originalLayer;
      
      // Create proxy
      windowAny[name] = new Proxy(originalLayer, {
        set(target, prop, value) {
          if (prop !== "length") {
            console.log(`[DATA LAYER] ${name}.push detected:`, JSON.stringify(value).substring(0, 100));
          }
          target[prop as any] = value;
          return true;
        },
      });
    };
    
    // Set up proxies for common data layers
    createDataLayerProxy("dataLayer");
    createDataLayerProxy("digitalData");
    createDataLayerProxy("utag_data");
    createDataLayerProxy("adobeDataLayer");
    
    console.log('[DATA LAYER] Proxy interception set up for dataLayer, digitalData, utag_data, adobeDataLayer');
    });
  } else if (typeof page.evaluateOnNewDocument === 'function') {
    // Puppeteer fallback
    await page.evaluateOnNewDocument(() => {
      const createDataLayerProxy = (name: string) => {
        const windowAny = window as any;
        const originalLayer = windowAny[name] || [];
        windowAny[`_original_${name}`] = originalLayer;
        windowAny[name] = new Proxy(originalLayer, {
          set(target, prop, value) {
            if (prop !== "length") {
              console.log(`[DATA LAYER] ${name}.push detected:`, JSON.stringify(value).substring(0, 100));
            }
            target[prop as any] = value;
            return true;
          },
        });
      };
      createDataLayerProxy("dataLayer");
      createDataLayerProxy("digitalData");
      createDataLayerProxy("utag_data");
      createDataLayerProxy("adobeDataLayer");
      console.log('[DATA LAYER] Proxy interception set up for dataLayer, digitalData, utag_data, adobeDataLayer');
    });
  }
}

// Legacy compatibility functions
export interface DetectedCMP {
  name: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DetectedTMS {
  name: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Legacy CMP detection function (for backward compatibility)
 */
export async function detectCMP(page: any, requests: any[], pageContent: string): Promise<DetectedCMP | null> {
  const requestUrls = requests.map(r => r.url);
  const result = detectConsentManagementSystem(pageContent, requestUrls);
  
  if (result.primary === 'none') {
    return null;
  }
  
  return {
    name: CMS_SIGNATURES[result.primary]?.name || result.primary,
    confidence: result.confidence,
  };
}
