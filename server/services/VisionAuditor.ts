/**
 * VisionAuditor.ts
 * Uses Gemini Vision API to verify visual compliance with 2026 CCPA/EDPB standards
 */

import { GoogleGenAI } from '@google/genai';
import { VisionAuditResult } from '../../types.js';

// API Key loading (consistent with project pattern)
function getApiKey(): string {
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    throw new Error('Gemini API key not found. Please set VITE_API_KEY or GEMINI_API_KEY in your environment.');
}

/**
 * Audit a screenshot for GPC "Opt-Out Honored" visual confirmation
 * CCPA 2026 requires visible acknowledgment of GPC signal
 */
export async function auditGPCConfirmation(screenshotBase64: string): Promise<VisionAuditResult> {
    console.log('[VISION AUDIT] Starting GPC confirmation check...');

    try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `ROLE: You are a CCPA 2026 compliance auditor analyzing a website screenshot.

TASK: Does this screenshot contain a VISIBLE message confirming that the user's "Global Privacy Control" (GPC) or "Opt-Out Preference" signal has been honored?

VALID CONFIRMATIONS INCLUDE:
- "Your opt-out preference has been honored."
- "GPC signal detected. We will not sell your data."
- "Do Not Sell or Share My Personal Information - Active"
- Any banner, toast, modal, or overlay explicitly acknowledging the GPC signal.
- Messages saying "We respect your privacy choice" or "Your Do Not Sell request has been applied"

INVALID (DO NOT COUNT):
- Standard cookie banners without GPC acknowledgment.
- Generic "Privacy Policy" or "Cookie Policy" links.
- "Manage Preferences" buttons without explicit opt-out confirmation.
- Disclaimers that say "We may still process data for X purposes" without confirming opt-out.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object (no markdown formatting) with this exact structure:
{
  "detected": true or false,
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "evidence": "A detailed description of what was found or not found. If detected, describe the exact text and location."
}`;

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
        console.log('[VISION AUDIT] Raw Gemini response:', responseText.substring(0, 200));

        // Extract JSON from potential markdown code blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[VISION AUDIT] Failed to extract JSON from response');
            return {
                detected: false,
                confidence: 'LOW',
                evidence: 'Failed to parse Gemini response',
                rawResponse: responseText
            };
        }

        const result: VisionAuditResult = JSON.parse(jsonMatch[0]);
        result.rawResponse = responseText;

        console.log(`[VISION AUDIT] GPC Confirmation: ${result.detected ? 'DETECTED' : 'NOT DETECTED'} (${result.confidence} confidence)`);
        return result;

    } catch (error: any) {
        console.error(`[VISION AUDIT] Error during GPC audit: ${error.message}`);
        return {
            detected: false,
            confidence: 'LOW',
            evidence: `Audit failed: ${error.message}`,
            rawResponse: error.stack
        };
    }
}

/**
 * Audit a consent banner screenshot for deceptive design patterns
 * EDPB 2026 Guidelines for Dark Patterns
 */
export async function auditDeceptiveDesign(screenshotBase64: string): Promise<VisionAuditResult> {
    console.log('[VISION AUDIT] Starting deceptive design check...');

    try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `ROLE: You are an EDPB (European Data Protection Board) compliance auditor analyzing a consent banner.

TASK: Identify any "dark patterns" or deceptive design elements in this consent banner.

DECEPTIVE PATTERNS INCLUDE:
- "Accept" button is significantly larger, more colorful, or more prominent than "Reject"
- "Reject" button is hidden, requires extra clicks, or is styled as plain text
- False hierarchy (e.g., "Accept" is a bright button, "Reject" is a gray link)
- Misleading language (e.g., "Continue to site" when it means "Accept All")
- Pre-checked boxes for non-essential purposes
- Confusing layout that makes rejection difficult

OUTPUT:
Return ONLY a valid JSON object:
{
  "detected": true or false (true if dark patterns found),
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "evidence": "Description of deceptive elements found, or confirmation of symmetric design"
}`;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
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
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            return {
                detected: false,
                confidence: 'LOW',
                evidence: 'Failed to parse response',
                rawResponse: responseText
            };
        }

        const result: VisionAuditResult = JSON.parse(jsonMatch[0]);
        result.rawResponse = responseText;

        console.log(`[VISION AUDIT] Dark Patterns: ${result.detected ? 'DETECTED' : 'NOT DETECTED'}`);
        return result;

    } catch (error: any) {
        console.error(`[VISION AUDIT] Error during deceptive design audit: ${error.message}`);
        return {
            detected: false,
            confidence: 'LOW',
            evidence: `Audit failed: ${error.message}`,
            rawResponse: error.stack
        };
    }
}

