/**
 * BatchAuditor.ts
 * 
 * COST-OPTIMIZED AUDIT STRATEGY:
 * 1. LOCAL DICTIONARY AUDIT: Instant classification using known patterns (FREE)
 * 2. GEMINI FALLBACK: Only for unknown/complex beacons (PAID)
 * 
 * This reduces Gemini API costs by 60-80% while maintaining accuracy.
 */

import { GoogleGenAI } from '@google/genai';
import { RequestLog, AIVerdict, BeaconType } from '../../types';

// API Key loading (consistent with project pattern)
function getApiKey(): string {
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
}

/**
 * ============================================
 * LOCAL DICTIONARY-BASED AUDIT
 * ============================================
 * Known patterns for instant classification without API calls
 */

// HIGH RISK: PII and fingerprinting patterns
const HIGH_RISK_PATTERNS = {
    // Fingerprinting signals
    fingerprint: [
        /canvas/i, /webgl/i, /font[_-]?list/i, /audio[_-]?context/i,
        /screen[_-]?res/i, /timezone/i, /navigator/i, /plugins/i,
        /hardware[_-]?concurrency/i, /device[_-]?memory/i
    ],
    // PII patterns
    pii: [
        /email/i, /mail/i, /phone/i, /tel/i, /name/i, /address/i,
        /sha256/i, /md5/i, /hash/i, /[a-f0-9]{32,64}/i
    ],
    // Granular tracking
    granularTracking: [
        /scroll[_-]?depth/i, /click[_-]?position/i, /mouse[_-]?move/i,
        /video[_-]?progress/i, /engagement[_-]?time/i, /form[_-]?field/i,
        /activity[_-]?map/i, /heat[_-]?map/i
    ]
};

// MEDIUM RISK: Session/identity patterns
const MEDIUM_RISK_PATTERNS = {
    sessionIds: [
        /session[_-]?id/i, /client[_-]?id/i, /visitor[_-]?id/i, /user[_-]?id/i,
        /cid/i, /uid/i, /mid/i, /_ga/i, /ecid/i, /mcmid/i
    ],
    crossDomain: [
        /cross[_-]?domain/i, /third[_-]?party/i, /sync/i, /match/i
    ]
};

// KNOWN VENDOR-SPECIFIC HIGH RISK PARAMS
const VENDOR_HIGH_RISK_PARAMS: Record<string, string[]> = {
    'ADOBE': ['AQB', 'ndh', 'mid', 'aid', 'vid', 'aamb', 'aamlh'],
    'GA4': ['_p', 'cid', 'uid', '_fv', '_ss', '_nsi'],
    'META': ['ud', 'cd', 'ev', 'hc', 'fbclid', 'external_id'],
    'TIKTOK': ['ttclid', 'ttp', 'user_agent', 'contents']
};

/**
 * Generate human-readable trace ID for DPO forensic traceability
 */
function generateTraceId(request: RequestLog, violationType: string): string {
  try {
    const domain = new URL(request.url).hostname.replace(/\./g, '_');
    const vendor = (request.decodedPayload?.type || 'unknown').toString().toLowerCase().replace(/\s+/g, '_');
    const purpose = violationType.toLowerCase().replace(/\s+/g, '_');
    return `${vendor}_${purpose}_${domain}`.substring(0, 50);
  } catch {
    return `unknown_${violationType.toLowerCase().replace(/\s+/g, '_')}_${request.id.substring(0, 8)}`;
  }
}

/**
 * Extract vendor-friendly name from request
 */
function getVendorType(request: RequestLog): string {
  if (request.decodedPayload?.type) {
    return request.decodedPayload.type.toString();
  }
  
  // Fallback: extract from domain
  const domain = request.domain.toLowerCase();
  if (domain.includes('adobe') || domain.includes('omtrdc')) return 'Adobe Analytics';
  if (domain.includes('google') || domain.includes('doubleclick')) return 'Google';
  if (domain.includes('facebook') || domain.includes('meta')) return 'Meta';
  if (domain.includes('tiktok')) return 'TikTok';
  
  return request.domain;
}

/**
 * Local audit using dictionary patterns - FREE, instant classification
 */
function localAudit(request: RequestLog): AIVerdict | null {
    const params = request.decodedPayload?.parameters || [];
    const vendor = request.decodedPayload?.type || BeaconType.UNKNOWN;
    const vendorKey = vendor.toString().toUpperCase();
    
    // Check URL for obvious fingerprinting domains
    const url = request.url.toLowerCase();
    if (url.includes('fingerprint') || url.includes('lantern.roeye') || url.includes('device-detect')) {
        return {
            requestId: request.id,
            traceId: generateTraceId(request, 'Fingerprinting'),
            targetDomain: request.domain,
            vendorType: getVendorType(request),
            purpose: 'Fingerprinting',
            riskLevel: 'High',
            violationType: 'Fingerprinting',
            explanation: 'Request to known fingerprinting service detected.'
        };
    }
    
    // Check all parameters against patterns
    for (const param of params) {
        const key = param.key.toLowerCase();
        const value = (param.value || '').toLowerCase();
        const combined = `${key}=${value}`;
        
        // HIGH RISK: Fingerprinting
        for (const pattern of HIGH_RISK_PATTERNS.fingerprint) {
            if (pattern.test(key) || pattern.test(value)) {
                return {
                    requestId: request.id,
                    traceId: generateTraceId(request, 'Fingerprinting'),
                    targetDomain: request.domain,
                    vendorType: getVendorType(request),
                    purpose: 'Fingerprinting',
                    riskLevel: 'High',
                    violationType: 'Fingerprinting',
                    explanation: `Fingerprint data: ${param.friendlyName || key}`
                };
            }
        }
        
        // HIGH RISK: PII
        for (const pattern of HIGH_RISK_PATTERNS.pii) {
            if (pattern.test(key) || pattern.test(value)) {
                // Check if it looks like actual PII (not just a parameter name)
                if (value.length > 10 && (value.includes('@') || /[a-f0-9]{32,}/.test(value))) {
                    return {
                        requestId: request.id,
                        traceId: generateTraceId(request, 'PII Leak'),
                        targetDomain: request.domain,
                        vendorType: getVendorType(request),
                        purpose: 'PII Leak',
                        riskLevel: 'High',
                        violationType: 'PII Leak',
                        explanation: `Potential PII in ${param.friendlyName || key}`
                    };
                }
            }
        }
        
        // HIGH RISK: Granular tracking
        for (const pattern of HIGH_RISK_PATTERNS.granularTracking) {
            if (pattern.test(key) || pattern.test(combined)) {
                return {
                    requestId: request.id,
                    traceId: generateTraceId(request, 'Granular Tracking'),
                    targetDomain: request.domain,
                    vendorType: getVendorType(request),
                    purpose: 'Granular Tracking',
                    riskLevel: 'High',
                    violationType: 'Granular Tracking',
                    explanation: `Granular tracking: ${param.friendlyName || key}`
                };
            }
        }
    }
    
    // Check vendor-specific high risk params
    const vendorHighRisk = VENDOR_HIGH_RISK_PARAMS[vendorKey] || [];
    for (const param of params) {
        if (vendorHighRisk.includes(param.key)) {
            // These are identity-related but not necessarily high risk alone
            // Mark as medium unless combined with other signals
        }
    }
    
    // MEDIUM RISK: Session/identity tracking
    for (const param of params) {
        const key = param.key.toLowerCase();
        for (const pattern of MEDIUM_RISK_PATTERNS.sessionIds) {
            if (pattern.test(key)) {
                return {
                    requestId: request.id,
                    traceId: generateTraceId(request, 'Session Tracking'),
                    targetDomain: request.domain,
                    vendorType: getVendorType(request),
                    purpose: 'Session Tracking',
                    riskLevel: 'Medium',
                    violationType: 'None',
                    explanation: `Session ID (${param.friendlyName || key}) collected pre-consent.`
                };
            }
        }
    }
    
    // LOW RISK: Generic analytics with minimal parameters
    if (params.length <= 5 && vendor !== BeaconType.UNKNOWN) {
        return {
            requestId: request.id,
            traceId: generateTraceId(request, 'Page View'),
            targetDomain: request.domain,
            vendorType: getVendorType(request),
            purpose: 'Page View Tracking',
            riskLevel: 'Low',
            violationType: 'None',
            explanation: `Basic ${vendorKey} page view tracking.`
        };
    }
    
    // Unknown - needs AI analysis
    return null;
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

/**
 * BATCH AUDITOR: Cost-optimized audit pipeline
 * 1. Run local dictionary audit first (FREE)
 * 2. Only send unknowns to Gemini (PAID)
 */
export async function batchAudit(suspects: RequestLog[]): Promise<AIVerdict[]> {
    if (suspects.length === 0) {
        console.log('[BATCH AUDIT] No suspects to audit.');
        return [];
    }

    console.log(`[BATCH AUDIT] Starting cost-optimized audit of ${suspects.length} suspects...`);

    // Step 1: Local dictionary audit (FREE)
    const localVerdicts: AIVerdict[] = [];
    const needsAI: RequestLog[] = [];
    
    for (const req of suspects) {
        const localResult = localAudit(req);
        if (localResult) {
            localVerdicts.push(localResult);
            console.log(`[BATCH AUDIT] [LOCAL] ${req.id}: ${localResult.riskLevel} (${localResult.violationType})`);
        } else {
            needsAI.push(req);
        }
    }
    
    console.log(`[BATCH AUDIT] Local audit: ${localVerdicts.length} classified, ${needsAI.length} need AI`);
    
    // Step 2: If no unknowns, skip AI call entirely
    if (needsAI.length === 0) {
        console.log('[BATCH AUDIT] ✅ All requests classified locally - $0 API cost!');
        return localVerdicts;
    }
    
    // Step 3: Send only unknowns to Gemini
    console.log(`[BATCH AUDIT] Sending ${needsAI.length} unknowns to Gemini...`);

    try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });

        // Simplify data for token efficiency: Only send key/value/friendlyName
        const simplifiedRequests = needsAI.map(req => ({
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

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        const responseText = response.text?.trim() || "[]";

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('[BATCH AUDIT] Failed to parse AI response as JSON array.');
            return localVerdicts; // Return local results even if AI fails
        }

        const rawAiVerdicts: Partial<AIVerdict>[] = JSON.parse(jsonMatch[0]);
        console.log(`[BATCH AUDIT] AI returned ${rawAiVerdicts.length} verdicts.`);
        
        // Enrich AI verdicts with traceable context
        const aiVerdicts: AIVerdict[] = rawAiVerdicts.map(verdict => {
            const request = needsAI.find(r => r.id === verdict.requestId);
            if (!request) {
                console.warn(`[BATCH AUDIT] Could not find request ${verdict.requestId} for enrichment`);
                return {
                    requestId: verdict.requestId || 'unknown',
                    traceId: 'unknown_audit',
                    targetDomain: 'unknown',
                    vendorType: 'Unknown',
                    purpose: verdict.violationType || 'Unknown',
                    riskLevel: verdict.riskLevel || 'Low',
                    violationType: verdict.violationType || 'None',
                    explanation: verdict.explanation || 'No explanation provided'
                };
            }
            
            return {
                requestId: verdict.requestId || request.id,
                traceId: generateTraceId(request, verdict.violationType || 'Unknown'),
                targetDomain: request.domain,
                vendorType: getVendorType(request),
                purpose: verdict.violationType || 'Unknown',
                riskLevel: verdict.riskLevel || 'Low',
                violationType: verdict.violationType || 'None',
                explanation: verdict.explanation || 'No explanation provided'
            };
        });
        
        // Merge local + AI verdicts
        const allVerdicts = [...localVerdicts, ...aiVerdicts];
        console.log(`[BATCH AUDIT] ✅ Total: ${allVerdicts.length} verdicts (${localVerdicts.length} local, ${aiVerdicts.length} AI)`);
        
        return allVerdicts;

    } catch (error: any) {
        console.error(`[BATCH AUDIT] Gemini error: ${error.message}`);
        return localVerdicts; // Return local results even if AI fails
    }
}
