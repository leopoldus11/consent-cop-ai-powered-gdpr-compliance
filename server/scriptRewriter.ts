/**
 * Script Rewriting for Data Layer Capture
 * 
 * Intercepts and rewrites JavaScript files before they execute,
 * injecting our data layer capture code.
 */

/**
 * Rewrite script content to inject data layer capture
 */
export function injectDataLayerCapture(scriptContent: string): string {
  // Pattern to detect data layer initialization
  const dataLayerPatterns = [
    /window\.(dataLayer|adobeDataLayer|digitalData|utag_data)\s*=/g,
    /(dataLayer|adobeDataLayer|digitalData|utag_data)\s*=\s*\[/g,
  ];
  
  // If script contains data layer patterns, inject capture code
  if (dataLayerPatterns.some(pattern => pattern.test(scriptContent))) {
    const captureCode = `
      // Injected by Consent Cop Scanner
      (function() {
        const captureDataLayer = (name, value) => {
          if (!window.__consentCopDataLayers) {
            window.__consentCopDataLayers = {};
          }
          window.__consentCopDataLayers[name] = value;
          console.log('[DATA LAYER CAPTURE]', name, '=', value);
        };
        
        // Capture existing data layers
        ['dataLayer', 'adobeDataLayer', 'digitalData', 'utag_data'].forEach(name => {
          if (window[name]) {
            captureDataLayer(name, window[name]);
          }
        });
      })();
    `;
    
    // Inject at the beginning of the script
    return captureCode + '\n' + scriptContent;
  }
  
  return scriptContent;
}

/**
 * Set up script rewriting via Playwright route
 */
export async function setupScriptRewriting(page: any): Promise<void> {
  console.log('[SCRIPT REWRITE] Setting up script rewriting...');
  
  // Intercept JavaScript files
  await page.route('**/*.js', async (route: any) => {
    try {
      const response = await route.fetch();
      const originalScript = await response.text();
      
      // Only rewrite if script is small enough (avoid large libraries)
      if (originalScript.length < 100000) { // 100KB limit
        const modifiedScript = injectDataLayerCapture(originalScript);
        await route.fulfill({
          response,
          body: modifiedScript,
          headers: {
            ...response.headers(),
            'Content-Type': 'application/javascript',
          },
        });
        console.log(`[SCRIPT REWRITE] Rewrote script: ${route.request().url().substring(0, 100)}`);
      } else {
        // For large scripts, just continue
        await route.continue();
      }
    } catch (error: any) {
      console.warn('[SCRIPT REWRITE] Error rewriting script:', error.message);
      await route.continue();
    }
  });
  
  console.log('[SCRIPT REWRITE] Script rewriting enabled');
}



