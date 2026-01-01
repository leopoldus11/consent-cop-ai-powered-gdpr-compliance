/**
 * Gemini AI-based Data Layer Detection
 * 
 * When standard data layer detection fails, use Gemini AI to analyze HTML/scripts
 * to find data layer objects and event-driven data layers.
 */

import { GoogleGenAI } from '@google/genai';

export interface GeminiDataLayerDetectionResult {
  detectedDataLayers: string[]; // Array of data layer names like ["dataLayer", "adobeDataLayer"]
  confidence: 'high' | 'medium' | 'low';
  evidence: string[]; // What patterns/evidence were found
  detectionSource?: {
    html?: boolean;
    scriptUrls?: string[];
    inlineScripts?: boolean;
    specificPatterns?: string[];
  };
}

const getApiKey = (): string => {
  // Try environment variables
  if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
  if (process.env.API_KEY) return process.env.API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
};

/**
 * Analyze page HTML and scripts using Gemini AI to detect data layers
 * 
 * INPUT:
 * - pageHTML: Full HTML content of the page (first 50KB)
 * - scriptUrls: Array of script tag src URLs
 * - inlineScripts: Concatenated content of all inline scripts
 * 
 * PROCESS:
 * - Send HTML snippet, script URLs, and inline script content to Gemini
 * - Ask Gemini to analyze for data layer patterns (dataLayer, adobeDataLayer, digitalData, etc.)
 * - Return detected data layer names with evidence
 */
export async function detectDataLayersWithGemini(
  pageHTML: string,
  scriptUrls: string[],
  inlineScripts: string
): Promise<GeminiDataLayerDetectionResult> {
  try {
    const genAI = new GoogleGenAI({ apiKey: getApiKey() });

    // Truncate HTML to first 50KB to stay within token limits
    const htmlSnippet = pageHTML.substring(0, 50000);
    
    // Get first 50 script URLs (most important ones)
    const scriptUrlsList = scriptUrls.slice(0, 50).join('\n');
    
    // Truncate inline scripts to 20KB
    const inlineScriptsSnippet = inlineScripts.substring(0, 20000);

    // PROMPT: Ask Gemini to analyze code patterns for data layer detection
    const prompt = `You are a web analytics detection expert. Analyze this webpage HTML and scripts to detect Data Layers (event-driven data layer objects).

HTML Content (first 50KB):
\`\`\`html
${htmlSnippet}
\`\`\`

Script URLs Found:
\`\`\`
${scriptUrlsList}
\`\`\`

Inline Script Content (first 20KB):
\`\`\`javascript
${inlineScriptsSnippet}
\`\`\`

Detect if ANY of these data layers are present in the code:

**CRITICAL: Adobe Client Data Layer (Event-Driven Data Layer)**
- adobeDataLayer (Adobe Client Data Layer library - look for: window.adobeDataLayer, adobeDataLayer = [], adobeDataLayer.push, adobeDataLayer.push({event: ...}))
- Look for: "adobeDataLayer", "Adobe Client Data Layer", "ACDL", "@adobe/adobe-client-data-layer"
- Configuration patterns: adobeDataLayer configuration in Next.js hydration data, React state, or script initialization
- The Adobe Client Data Layer is an event-driven data layer - look for initialization code that creates an array

- dataLayer (Google Tag Manager - look for: window.dataLayer, dataLayer.push, dataLayer = [])
- digitalData (Adobe Analytics - look for: window.digitalData, digitalData = {})
- _satellite (Adobe Launch - look for: window._satellite, _satellite.pageBottom)
- utag_data (Tealium - look for: window.utag_data)
- Event-driven data layers (look for: .push({event: ...}), initialization patterns)

IMPORTANT: 
1. Look for initialization patterns (arrays/objects being created)
2. Look for configuration in HTML/JSON (especially Next.js __NEXT_DATA__, script tags with data attributes)
3. Look for push() calls and event patterns
4. Adobe Client Data Layer (adobeDataLayer) is often configured but not initialized until scripts load - check for configuration patterns
5. Event-driven data layers often use .push() with event objects like {event: 'pageView', ...}

Respond with a JSON object in this exact format:
{
  "detectedDataLayers": ["dataLayer", "adobeDataLayer"],  // Array of detected data layer names, empty array if none
  "confidence": "high",  // "high", "medium", or "low" based on evidence strength
  "evidence": ["Found window.dataLayer initialization in inline script", "Found dataLayer.push({event: 'pageView'}) pattern"],  // What patterns you found
  "detectionSource": {
    "html": true,  // Was it found in HTML content?
    "scriptUrls": [],  // Which script URLs contained it? (usually empty for data layers)
    "inlineScripts": true,  // Was it found in inline scripts?
    "specificPatterns": ["dataLayer.push", "window.adobeDataLayer"]  // Specific code patterns/keywords found
  }
}

If you find NO data layers, return:
{
  "detectedDataLayers": [],
  "confidence": "high",
  "evidence": ["No data layer patterns found in HTML or scripts"],
  "detectionSource": {}
}`;

    console.log('[GEMINI DATA LAYER] Calling Gemini AI to analyze page content for data layers...');
    // Use same format as services/gemini.ts
    const response = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview', // Use same model as services/gemini.ts
      contents: prompt,
    });
    const responseText = response.text?.trim() || "{}";
    
    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Parse JSON response
    const parsed = JSON.parse(jsonStr) as GeminiDataLayerDetectionResult;
    
    console.log(`[GEMINI DATA LAYER] Detected data layers: ${parsed.detectedDataLayers.join(', ') || 'none'} (confidence: ${parsed.confidence})`);
    if (parsed.evidence.length > 0) {
      console.log(`[GEMINI DATA LAYER] Evidence: ${parsed.evidence.slice(0, 3).join('; ')}`);
    }
    
    return parsed;
  } catch (error: any) {
    console.error('[GEMINI DATA LAYER] Error calling Gemini AI:', error.message);
    return {
      detectedDataLayers: [],
      confidence: 'low',
      evidence: [`Error: ${error.message}`],
      detectionSource: {},
    };
  }
}

