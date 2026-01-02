
import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, AIAnalysis, BeaconAnalysis } from "../types";

// Simple in-memory cache for AI analysis (frontend only, server-side uses server/cache.ts)
const aiAnalysisCache = new Map<string, { data: AIAnalysis; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(url: string, type: 'analysis' | 'beacon' = 'analysis', suffix?: string): string {
  return suffix ? `${url}::${type}::${suffix}` : `${url}::${type}`;
}

// Helper function to extract JSON from potential markdown code blocks
const extractJSON = (text: string): string => {
  // Remove markdown code block wrappers if present (```json ... ```)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  // If no markdown wrapper, return trimmed text
  return text.trim();
};

// Get API key from environment or user's custom key (BYOK)
const getApiKey = async (): Promise<string> => {
  // First, try to get user's custom API key (BYOK)
  try {
    const { getCustomApiKey } = await import('./auth.js');
    const customKey = await getCustomApiKey();
    if (customKey) {
      console.log('[API KEY] Using user-provided BYOK key');
      return customKey;
    }
  } catch (error) {
    console.log('[API KEY] No custom key found, using default');
  }
  
  // Fallback to environment variable
  if (import.meta.env.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  // Fallback to process.env.API_KEY (via vite.config.ts define)
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }
  throw new Error('Gemini API key not found. Please set VITE_API_KEY in your .env.local file or provide your own key in settings.');
};

// Note: GoogleGenAI client initialization moved inside functions to pick up the most 
// recent API key as per the @google/genai guidelines.

export const analyzeScanResult = async (result: ScanResult, options?: { useCache?: boolean; useFlashModel?: boolean }): Promise<AIAnalysis> => {
  const { useCache = true, useFlashModel = false } = options || {};
  
  // Check cache first
  if (useCache) {
    const cacheKey = getCacheKey(result.url, 'analysis', `${result.violationsCount}-${result.requests.length}`);
    const cached = aiAnalysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[CACHE] Returning cached AI analysis for: ${result.url}`);
      return cached.data;
    }
  }
  
  // Always initialize GoogleGenAI inside the function to use the latest API key
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Use cheaper Flash model for simpler analysis if requested
  const model = useFlashModel ? 'gemini-1.5-flash' : 'gemini-3-pro-preview';
  console.log(`[AI] Using model: ${model} for analysis of ${result.url}`);
  
  // Build network log summary for analysis
  const preConsentRequests = result.requests.filter(r => {
    const sorted = [...result.requests].sort((a, b) => a.timestamp - b.timestamp);
    const firstAllowed = sorted.find(req => req.status === 'allowed');
    const consentTime = firstAllowed?.timestamp || sorted[sorted.length - 1]?.timestamp || 0;
    return r.timestamp < consentTime;
  });
  
  const networkLogSummary = preConsentRequests
    .slice(0, 50) // Limit to first 50 for prompt size
    .map(r => ({
      domain: r.domain,
      type: r.type,
      status: r.status,
      dataTypes: r.dataTypes,
      timestamp: r.timestamp
    }));

  const prompt = `You are a Senior DPO (Data Protection Officer). Analyze this network log. Do not just summarize. Identify specific GDPR Article 6 violations. 

  Scan Context for ${result.url}:
  - Pre-Consent Violations: ${result.violationsCount}
  - Total Requests: ${result.requests.length}
  - CMP Detected: ${result.bannerProvider || 'None'}
  - TMS Detected: ${result.tmsDetected.join(', ') || 'None'}
  
  Network Log (Pre-Consent Requests):
  ${JSON.stringify(networkLogSummary, null, 2)}
  
  Your analysis MUST be structured and actionable:
  
  1. Executive Summary: Identify specific GDPR Article 6 violations. Group results by:
     - Unlocked Pixels (Pre-consent): Marketing/tracking pixels that fired before consent
     - Piggybacking Trackers: Third-party scripts that load additional trackers
     - PII Leakage in URLs: Personal identifiers found in request parameters
  
  2. Severity Assessment: Based on actual violations found (Critical/High/Medium/Low)
  
  3. Remediation Steps: Provide 3-5 specific technical remediation steps with priority:
     - Immediate: Critical violations requiring immediate action
     - Next: Important fixes to implement soon
     - Soon: Recommended improvements
  
  4. Legal Context: Reference specific GDPR articles violated (e.g., Art. 6(1), Art. 7, ePrivacy Directive Art. 5(3))
  
  5. Disclaimer: Standard text noting this is technical analysis requiring legal review.
  
  Return strictly valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
          remediationSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['Immediate', 'Next', 'Soon'] }
              },
              required: ['title', 'description', 'priority']
            }
          },
          legalContext: { type: Type.STRING },
          disclaimer: { type: Type.STRING }
        },
        required: ['summary', 'severity', 'remediationSteps', 'legalContext', 'disclaimer']
      }
    }
  });

  // text is a property, not a method, on GenerateContentResponse
  const rawText = response.text?.trim() || "{}";
  // Extract JSON from potential markdown code blocks
  const jsonStr = extractJSON(rawText);
  try {
    const analysis = JSON.parse(jsonStr);
    
    // Cache the result
    if (useCache) {
      const cacheKey = getCacheKey(result.url, 'analysis', `${result.violationsCount}-${result.requests.length}`);
      aiAnalysisCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
    }
    
    return analysis;
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response:', rawText);
    throw new Error('AI response was not valid JSON. Please try again.');
  }
};

export const getDeepBeaconAnalysis = async (domain: string, params: Record<string, string>, options?: { useCache?: boolean; useFlashModel?: boolean }): Promise<BeaconAnalysis> => {
  const { useCache = true, useFlashModel = false } = options || {};
  
  // Check cache first (use param hash as cache key)
  if (useCache) {
    const paramsHash = JSON.stringify(params);
    const cacheKey = getCacheKey(domain, 'beacon', paramsHash.substring(0, 100));
    const cached = aiAnalysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[CACHE] Returning cached beacon analysis for: ${domain}`);
      return cached.data as BeaconAnalysis;
    }
  }
  
  // Always initialize GoogleGenAI inside the function to use the latest API key
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Use cheaper Flash model for simpler analysis if requested
  const model = useFlashModel ? 'gemini-1.5-flash' : 'gemini-3-pro-preview';
  console.log(`[AI] Using model: ${model} for beacon analysis of ${domain}`);
  
  const prompt = `Act as a technical forensic analyst. Breakdown these tracking parameters for ${domain}:
  ${JSON.stringify(params, null, 2)}
  Identify identifiers, session IDs, and fingerprints. Explain the cross-site tracking capability.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING, description: "Type of tracker (e.g. Analytics, Advertising, Behavior)" },
          dataExfiltration: { type: Type.STRING, description: "Detailed list of what PII or identifiers are being sent" },
          forensicEvidence: { type: Type.STRING, description: "Why this specifically violates 'Privacy by Default'" },
          remediation: { type: Type.STRING, description: "Technical fix for a developer" }
        },
        required: ['classification', 'dataExfiltration', 'forensicEvidence', 'remediation']
      }
    }
  });

  // text is a property, not a method, on GenerateContentResponse
  const rawText = response.text?.trim() || "{}";
  // Extract JSON from potential markdown code blocks
  const jsonStr = extractJSON(rawText);
  try {
    const analysis = JSON.parse(jsonStr);
    
    // Cache the result
    if (useCache) {
      const paramsHash = JSON.stringify(params);
      const cacheKey = getCacheKey(domain, 'beacon', paramsHash.substring(0, 100));
      aiAnalysisCache.set(cacheKey, { data: analysis as any, timestamp: Date.now() });
    }
    
    return analysis;
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response:', rawText);
    throw new Error('AI response was not valid JSON. Please try again.');
  }
};
