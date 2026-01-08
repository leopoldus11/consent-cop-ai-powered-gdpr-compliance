/**
 * BatchAuditor.ts
 * Automatically audits a batch of high-risk (suspect) requests using Gemini 1.5 Flash.
 * Cost-optimized: Sends only Key/Value pairs, not full URLs.
 */

import { GoogleGenAI } from '@google/genai';
import { RequestLog, AIVerdict } from '../../types';

// API Key loading (consistent with project pattern)
function getApiKey(): string {
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
}

// SUSPECT FILTER: Selects high-risk pre-consent requests for AI audit
export function filterSuspects(requests: RequestLog[]): RequestLog[] {
    return requests
        .filter(req => {
            // Must be pre-consent
            if (req.consentState !== 'pre-consent') return false;

            // Must have decoded payload with parameters OR status is violation
            const hasParameters = req.decodedPayload && req.decodedPayload.parameters.length > 0;
            const isViolation = req.status === 'violation';

            return hasParameters || isViolation;
        })
        // Prioritize by number of parameters (more data = higher risk)
        .sort((a, b) => {
            const aParams = a.decodedPayload?.parameters.length || 0;
            const bParams = b.decodedPayload?.parameters.length || 0;
            return bParams - aParams;
        })
        // Limit to top 10 for cost efficiency
        .slice(0, 10);
}

// BATCH AUDITOR: Sends suspects to Gemini for forensic analysis
export async function batchAudit(suspects: RequestLog[]): Promise<AIVerdict[]> {
    if (suspects.length === 0) {
        console.log('[BATCH AUDIT] No suspects to audit.');
        return [];
    }

    console.log(`[BATCH AUDIT] Auditing ${suspects.length} suspect requests with Gemini...`);

    try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });

        // Simplify data for token efficiency: Only send key/value/friendlyName
        const simplifiedRequests = suspects.map(req => ({
            id: req.id,
            vendor: req.decodedPayload?.type || 'Unknown',
            consentState: req.consentState,
            status: req.status,
            parameters: req.decodedPayload?.parameters.map(p => ({
                key: p.key,
                value: p.value,
                friendlyName: p.friendlyName
            })) || []
        }));

        const prompt = `
Role: GDPR Forensic Analyst.
Task: Audit the following 'Pre-Consent' network requests for PII leaks or illegal tracking.

Definitions:
- PII: Email, Hashed IDs (sha256/md5), Precise Location (lat/long), Names, Phones, Device IDs.
- High Risk: Granular behavior tracking (scroll depth, precise clicks, video progress) BEFORE consent.
- Medium Risk: Generic session/client IDs before consent.
- Low Risk: Page view tracking without identifiable user data.

Input Data (Request Batch):
${JSON.stringify(simplifiedRequests, null, 2)}

Output Rule:
Return ONLY a valid JSON array with this exact schema, no markdown or extra text:
[
  {
    "requestId": "string (matches input id)",
    "riskLevel": "High" | "Medium" | "Low",
    "violationType": "PII Leak" | "Granular Tracking" | "Fingerprinting" | "None",
    "explanation": "string (Concise, max 15 words)"
  }
]
`;

        // Use same format as geminiTMSDetection.ts
        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash', // Fast model for cost efficiency
            contents: prompt,
        });
        const responseText = response.text?.trim() || "[]";

        // Parse JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('[BATCH AUDIT] Failed to parse AI response as JSON array.');
            return [];
        }

        const verdicts: AIVerdict[] = JSON.parse(jsonMatch[0]);
        console.log(`[BATCH AUDIT] Received ${verdicts.length} verdicts.`);
        return verdicts;

    } catch (error: any) {
        console.error(`[BATCH AUDIT] Error during Gemini audit: ${error.message}`);
        return [];
    }
}
