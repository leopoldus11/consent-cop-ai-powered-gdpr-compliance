
import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, AIAnalysis, BeaconAnalysis } from "../types";

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

// Get API key from environment (supports both Vite-native and define-based approaches)
const getApiKey = (): string => {
  // Try Vite-native approach first
  if (import.meta.env.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  // Fallback to process.env.API_KEY (via vite.config.ts define)
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }
  throw new Error('Gemini API key not found. Please set VITE_API_KEY in your .env.local file.');
};

// Note: GoogleGenAI client initialization moved inside functions to pick up the most 
// recent API key as per the @google/genai guidelines.

export const analyzeScanResult = async (result: ScanResult): Promise<AIAnalysis> => {
  // Always initialize GoogleGenAI inside the function to use the latest API key
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `Act as a Senior Data Privacy Consultant. Analyze this GDPR compliance scan for ${result.url}. 
  
  IMPORTANT: This is a technical scan result. Do NOT make definitive legal claims. Use cautious language like "may indicate", "potential", "appears to", "suggests" rather than definitive statements.
  
  Scan Context:
  - Potential Violations: ${result.violationsCount} (Requests detected before user interaction)
  - Total Requests: ${result.requests.length}
  - Technologies Detected: ${result.tmsDetected.join(', ')} / ${result.bannerProvider || 'No CMP detected'}.
  
  Your output MUST be strictly professional, cautious, and structured. 
  1. Executive Summary: High-level business impact using cautious language. Note that these are technical findings that require legal review.
  2. Severity: Choose based on count and type of PII potentially leaked. Use "Potential" or "Possible" severity.
  3. Remediation: 3 clear technical steps as recommendations.
  4. Legal Context: Reference specific GDPR articles (e.g., Art. 5, Art. 7, ePrivacy Directive) but note that actual compliance requires review of the site's privacy policy and legal framework.
  5. Disclaimer: A standard text stating this is an AI tool, not legal advice, and findings should be verified with legal counsel and the site's privacy policy.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded to Pro for high-reasoning forensic tasks
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
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response:', rawText);
    throw new Error('AI response was not valid JSON. Please try again.');
  }
};

export const getDeepBeaconAnalysis = async (domain: string, params: Record<string, string>): Promise<BeaconAnalysis> => {
  // Always initialize GoogleGenAI inside the function to use the latest API key
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `Act as a technical forensic analyst. Breakdown these tracking parameters for ${domain}:
  ${JSON.stringify(params, null, 2)}
  Identify identifiers, session IDs, and fingerprints. Explain the cross-site tracking capability.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded to Pro for complex forensic analysis
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
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    console.error('Raw response:', rawText);
    throw new Error('AI response was not valid JSON. Please try again.');
  }
};
