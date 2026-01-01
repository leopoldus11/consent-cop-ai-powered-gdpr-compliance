/**
 * Enhanced Detection Utilities
 * 
 * Hybrid detection methods that combine HTML pattern matching with runtime checks
 * to detect TMS and data layers even when JavaScript execution is blocked
 */

/**
 * Detect data layers from HTML configuration patterns (works even when JS is blocked)
 */
export function detectDataLayersFromHTML(pageContent: string, inlineScripts: string): string[] {
  const detectedLayers: string[] = [];
  
  // Combine content sources
  const combinedContent = pageContent + ' ' + inlineScripts;
  
  // Adobe Client Data Layer (Event-Driven Data Layer) - CRITICAL
  // Look for configuration patterns that indicate adobeDataLayer usage
  const adobeDataLayerPatterns = [
    /adobeDataLayer/i,  // Direct reference
    /adobeLaunchScriptUrl/i,  // Configuration key (found in dertour.de)
    /adobeAMCVId/i,  // Adobe Marketing Cloud Visitor ID
    /@adobe\/adobe-client-data-layer/i,  // Package name
    /Adobe Client Data Layer/i,  // Full name
    /ACDL/i,  // Abbreviation
    /window\.adobeDataLayer/i,  // Window object reference
    /adobeDataLayer\s*[=:]/i,  // Assignment/initialization
    /adobeDataLayer\.push/i,  // Push method
  ];
  
  const hasAdobeDataLayer = adobeDataLayerPatterns.some(pattern => pattern.test(combinedContent));
  if (hasAdobeDataLayer && !detectedLayers.includes('adobeDataLayer')) {
    detectedLayers.push('adobeDataLayer');
    console.log('[HTML PATTERN] Detected adobeDataLayer from HTML/configuration patterns');
  }
  
  // Google Tag Manager dataLayer
  const gtmDataLayerPatterns = [
    /window\.dataLayer/i,
    /dataLayer\.push/i,
    /dataLayer\s*[=:]\s*\[\]/i,
    /googletagmanager\.com/i,
  ];
  
  const hasGTMDataLayer = gtmDataLayerPatterns.some(pattern => pattern.test(combinedContent));
  if (hasGTMDataLayer && !detectedLayers.includes('dataLayer')) {
    detectedLayers.push('dataLayer');
    console.log('[HTML PATTERN] Detected dataLayer from HTML patterns');
  }
  
  // Adobe Launch _satellite
  if ((/_satellite/i.test(combinedContent) || /assets\.adobedtm\.com/i.test(combinedContent)) && 
      !detectedLayers.includes('_satellite')) {
    detectedLayers.push('_satellite');
    console.log('[HTML PATTERN] Detected _satellite from HTML patterns');
  }
  
  // digitalData (Adobe Analytics)
  if (/digitalData/i.test(combinedContent) && !detectedLayers.includes('digitalData')) {
    detectedLayers.push('digitalData');
    console.log('[HTML PATTERN] Detected digitalData from HTML patterns');
  }
  
  return detectedLayers;
}

/**
 * Extract detailed configuration information for analytics teams
 */
export function extractAnalyticsConfiguration(
  pageContent: string, 
  inlineScripts: string,
  scriptUrls: string[]
): {
  adobeConfiguration?: {
    launchScriptUrl?: string;
    amcvId?: string;
    targetToken?: string;
    dataLayerName?: string;
  };
  gtmConfiguration?: {
    containerId?: string;
    dataLayerName?: string;
  };
  detectedTechnologies: string[];
} {
  const combined = pageContent + ' ' + inlineScripts;
  const result: any = {
    detectedTechnologies: [],
  };
  
  // Extract Adobe Launch configuration
  const adobeLaunchMatch = combined.match(/adobeLaunchScriptUrl["']?\s*[:=]\s*["']?([^"'\s]+)/i);
  const amcvIdMatch = combined.match(/adobeAMCVId["']?\s*[:=]\s*["']?([^"'\s]+)/i);
  const targetTokenMatch = combined.match(/adobeTargetToken["']?\s*[:=]\s*["']?([^"'\s]+)/i);
  
  if (adobeLaunchMatch || amcvIdMatch || targetTokenMatch || /adobeDataLayer/i.test(combined)) {
    result.adobeConfiguration = {};
    if (adobeLaunchMatch) result.adobeConfiguration.launchScriptUrl = adobeLaunchMatch[1];
    if (amcvIdMatch) result.adobeConfiguration.amcvId = amcvIdMatch[1];
    if (targetTokenMatch) result.adobeConfiguration.targetToken = targetTokenMatch[1];
    if (/adobeDataLayer/i.test(combined)) result.adobeConfiguration.dataLayerName = 'adobeDataLayer';
    result.detectedTechnologies.push('Adobe Experience Platform');
  }
  
  // Extract GTM configuration
  const gtmMatch = combined.match(/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/i) ||
                   scriptUrls.find(url => /googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/i.test(url))?.match(/id=(GTM-[A-Z0-9]+)/i);
  if (gtmMatch || /dataLayer/i.test(combined)) {
    result.gtmConfiguration = {};
    if (gtmMatch) result.gtmConfiguration.containerId = gtmMatch[1];
    if (/dataLayer/i.test(combined)) result.gtmConfiguration.dataLayerName = 'dataLayer';
    result.detectedTechnologies.push('Google Tag Manager');
  }
  
  return result;
}

