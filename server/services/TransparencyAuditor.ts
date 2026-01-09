/**
 * TransparencyAuditor.ts
 * GDPR Article 13(1)(f) Compliance Auditor
 * 
 * Verifies that consent banners disclose:
 * 1. Categories of personal data collected
 * 2. Specific third-party recipients (not just "our partners")
 * 3. Third-country transfers and legal basis (SCCs, DPF, BCRs)
 * 
 * EDPB 2026 Coordinated Enforcement Action Priority
 */

import { GoogleGenAI } from '@google/genai';
import { TransparencyResult } from '../../types.js';

// API Key loading (consistent with project pattern)
function getApiKey(): string {
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
}

/**
 * Audit a consent banner screenshot for Article 13 GDPR transparency requirements
 * EDPB 2026: Sites must explicitly disclose third-party recipients and cross-border transfers
 */
export async function auditArticle13(screenshotBase64: string): Promise<TransparencyResult> {
    console.log('[TRANSPARENCY AUDIT] Starting Article 13 compliance check...');

    try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `ROLE: You are an EDPB Article 13 GDPR compliance auditor analyzing a consent banner screenshot.

TASK: Verify compliance with GDPR Article 13(1) transparency requirements. Analyze this consent banner to determine if it provides adequate information about data processing.

MANDATORY DISCLOSURES UNDER ARTICLE 13:

1. DATA CATEGORIES (Art. 13(1)(c))
   VALID: "We collect browsing behavior, device identifiers, IP addresses, cookie data"
   INVALID: "We collect data" or "Information about you" (too vague)

2. SPECIFIC THIRD-PARTY RECIPIENTS (Art. 13(1)(e))
   VALID: "Google LLC", "Meta Platforms Ireland Ltd", "Adobe Inc."
   INVALID: "Our partners", "Third parties", "Service providers" (generic terms)

3. THIRD-COUNTRY TRANSFERS (Art. 13(1)(f))
   VALID: "Data transferred to US via Standard Contractual Clauses"
   INVALID: Links to privacy policy without inline disclosure
   INVALID: "We may transfer data internationally" (no country named)

4. PURPOSE SPECIFICATION (Art. 13(1)(c))
   VALID: "Behavioral advertising via Meta pixel for retargeting campaigns"
   INVALID: "To improve our services" (too vague)
   INVALID: "Analytics" without specifying what is analyzed

COMPLIANCE LEVELS:
- FULL: All 4 requirements met with specific details
- PARTIAL: 2-3 requirements met, or some details are generic
- NONE: 0-1 requirements met, or all disclosures are vague

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown formatting):
{
  "hasDataCategories": true/false,
  "hasThirdPartyList": true/false,
  "dataCategoriesFound": ["category1", "category2", ...],
  "thirdPartiesFound": ["Google LLC", "Meta Platforms", ...],
  "articleCompliance": "FULL" | "PARTIAL" | "NONE",
  "evidence": "Detailed explanation of what was found or missing. Quote specific text from the banner."
}

IMPORTANT: 
- Generic terms like "partners" or "vendors" = hasThirdPartyList: false
- Must name specific companies to pass
- Links to privacy policy without inline disclosure = NOT compliant`;

        // Gemini Vision API call
        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp', // Use Flash for cost efficiency
            contents: {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: screenshotBase64
                        }
                    }
                ]
            },
        });

        const responseText = response.response?.text() || '{}';
        console.log('[TRANSPARENCY AUDIT] Raw Gemini response:', responseText.substring(0, 300));

        // Extract JSON from potential markdown code blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[TRANSPARENCY AUDIT] Failed to extract JSON from response');
            return {
                hasDataCategories: false,
                hasThirdPartyList: false,
                dataCategoriesFound: [],
                thirdPartiesFound: [],
                articleCompliance: 'NONE',
                evidence: 'Failed to parse Gemini response - AI returned non-JSON',
                rawResponse: responseText
            };
        }

        let parsedResult: Partial<TransparencyResult>;
        try {
            parsedResult = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('[TRANSPARENCY AUDIT] JSON parse error:', parseError);
            return {
                hasDataCategories: false,
                hasThirdPartyList: false,
                dataCategoriesFound: [],
                thirdPartiesFound: [],
                articleCompliance: 'NONE',
                evidence: 'Failed to parse Gemini JSON response',
                rawResponse: responseText
            };
        }

        // Defensive null safety for all fields
        const result: TransparencyResult = {
            hasDataCategories: parsedResult.hasDataCategories ?? false,
            hasThirdPartyList: parsedResult.hasThirdPartyList ?? false,
            dataCategoriesFound: Array.isArray(parsedResult.dataCategoriesFound) 
                ? parsedResult.dataCategoriesFound 
                : [],
            thirdPartiesFound: Array.isArray(parsedResult.thirdPartiesFound) 
                ? parsedResult.thirdPartiesFound 
                : [],
            articleCompliance: parsedResult.articleCompliance || 'NONE',
            evidence: parsedResult.evidence || 'No evidence extracted from AI response',
            rawResponse: responseText
        };

        // Log findings safely
        console.log(`[TRANSPARENCY AUDIT] Article 13 Compliance: ${result.articleCompliance}`);
        console.log(`[TRANSPARENCY AUDIT] Data Categories: ${result.hasDataCategories ? 'FOUND' : 'MISSING'}`);
        console.log(`[TRANSPARENCY AUDIT] Third Parties: ${result.hasThirdPartyList ? 'FOUND' : 'MISSING'}`);
        
        if (result.thirdPartiesFound && result.thirdPartiesFound.length > 0) {
            console.log(`[TRANSPARENCY AUDIT] Named Recipients: ${result.thirdPartiesFound.join(', ')}`);
        }

        return result;

    } catch (error: any) {
        console.error(`[TRANSPARENCY AUDIT] Error during Article 13 audit: ${error.message}`);
        return {
            hasDataCategories: false,
            hasThirdPartyList: false,
            dataCategoriesFound: [],
            thirdPartiesFound: [],
            articleCompliance: 'NONE',
            evidence: `Audit failed: ${error.message}`,
            rawResponse: error.stack
        };
    }
}

/**
 * Check if a consent banner mentions transfer mechanisms (SCCs, DPF, BCRs)
 * This is a supplementary check for Art. 46 GDPR
 */
export function detectTransferMechanism(bannerText: string): {
    mechanism: 'SCC' | 'DPF' | 'BCR' | 'NONE';
    evidence: string;
} {
    const text = bannerText.toLowerCase();

    // Standard Contractual Clauses
    if (text.includes('standard contractual clauses') || text.includes('scc')) {
        return {
            mechanism: 'SCC',
            evidence: 'Standard Contractual Clauses (SCCs) mentioned'
        };
    }

    // Data Privacy Framework (formerly Privacy Shield)
    if (text.includes('data privacy framework') || 
        text.includes('dpf') || 
        text.includes('eu-us framework')) {
        return {
            mechanism: 'DPF',
            evidence: 'Data Privacy Framework (DPF) mentioned'
        };
    }

    // Binding Corporate Rules
    if (text.includes('binding corporate rules') || text.includes('bcr')) {
        return {
            mechanism: 'BCR',
            evidence: 'Binding Corporate Rules (BCRs) mentioned'
        };
    }

    return {
        mechanism: 'NONE',
        evidence: 'No recognized transfer mechanism disclosed'
    };
}

