/**
 * Gemini AI-based TMS Detection
 * 
 * When network requests are blocked by bot detection, we analyze page HTML/scripts
 * using Gemini AI to infer TMS presence from code patterns.
 */

import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  // Try environment variables
  if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
  if (process.env.API_KEY) return process.env.API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
};

export interface GeminiTMSDetectionResult {
  detectedTMS: string[]; // Array of TMS names like ["Adobe Experience Platform Launch"]
  confidence: 'high' | 'medium' | 'low';
  evidence: string[]; // What patterns/evidence were found
  detectionSource?: {
    html?: boolean; // Found in HTML content
    scriptUrls?: string[]; // Found in these script URLs
    inlineScripts?: boolean; // Found in inline scripts
    specificPatterns?: string[]; // Specific code patterns found
  };
}

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

/**
 * Analyze page HTML and scripts using Gemini AI to detect TMS
 * 
 * INPUT:
 * - pageHTML: Full HTML content of the page (first 50KB to stay within token limits)
 * - scriptUrls: Array of script tag src URLs
 * - inlineScripts: Concatenated content of all inline scripts
 * 
 * PROCESS:
 * - Send HTML snippet, script URLs, and inline script content to Gemini
 * - Ask Gemini to analyze for TMS patterns (Adobe, GTM, Tealium, etc.)
 * - Return detected TMS names with confidence
 */
export async function detectTMSWithGemini(
  pageHTML: string,
  scriptUrls: string[],
  inlineScripts: string
): Promise<GeminiTMSDetectionResult> {
  try {
    const genAI = new GoogleGenAI({ apiKey: getApiKey() });

    // Truncate HTML to first 50KB to stay within token limits
    const htmlSnippet = pageHTML.substring(0, 50000);
    
    // Get first 50 script URLs (most important ones)
    const scriptUrlsList = scriptUrls.slice(0, 50).join('\n');
    
    // Truncate inline scripts to 20KB
    const inlineScriptsSnippet = inlineScripts.substring(0, 20000);

    // PROMPT: Ask Gemini to analyze code patterns for TMS detection
    const prompt = `You are a web analytics detection expert. Analyze this webpage HTML and scripts to detect Tag Management Systems (TMS).

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

Detect if ANY of these TMS are present:
- Adobe Experience Platform Launch (look for: assets.adobedtm.com, AppMeasurement, _satellite, adobeDataLayer, digitalData)
- Adobe Experience Platform Web SDK (look for: alloy.js, adobedc.net, adobeDataLayer)
- Google Tag Manager (look for: googletagmanager.com, dataLayer, google_tag_manager)
- Tealium (look for: tags.tiqcdn.com, utag.js, utag_data)
- Segment (look for: segment.io, analytics.js)
- Other common TMS

Respond with a JSON object in this exact format:
{
  "detectedTMS": ["Adobe Experience Platform Launch"],  // Array of detected TMS names, empty array if none
  "confidence": "high",  // "high", "medium", or "low" based on evidence strength
  "evidence": ["Found assets.adobedtm.com in script URL", "Found adobeDataLayer in inline script"],  // What patterns you found
  "detectionSource": {
    "html": true,  // Was it found in HTML content?
    "scriptUrls": ["https://assets.adobedtm.com/xxx/launch.min.js"],  // Which script URLs contained it?
    "inlineScripts": true,  // Was it found in inline scripts?
    "specificPatterns": ["adobeLaunchScriptUrl", "AppMeasurement"]  // Specific code patterns/keywords found
  }
}

If you find NO TMS, return:
{
  "detectedTMS": [],
  "confidence": "high",
  "evidence": ["No TMS patterns found in HTML or scripts"],
  "detectionSource": {}
}`;

    console.log('[GEMINI TMS] Calling Gemini AI to analyze page content...');
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
    const parsed = JSON.parse(jsonStr) as GeminiTMSDetectionResult;
    
    console.log(`[GEMINI TMS] Detected TMS: ${parsed.detectedTMS.join(', ') || 'none'} (confidence: ${parsed.confidence})`);
    if (parsed.evidence.length > 0) {
      console.log(`[GEMINI TMS] Evidence: ${parsed.evidence.slice(0, 3).join('; ')}`);
    }
    
    return parsed;
  } catch (error: any) {
    console.error('[GEMINI TMS] Error calling Gemini AI:', error.message);
    return {
      detectedTMS: [],
      confidence: 'low',
      evidence: [`Error: ${error.message}`],
    };
  }
}

