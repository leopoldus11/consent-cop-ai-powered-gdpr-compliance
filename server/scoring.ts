import { RequestLog, ParityOfEaseResult, GranularityResult, AccessibilityResult } from '../types.js';

// GDPR Audit wrapper type
interface GDPRAuditResult {
  parityOfEase?: ParityOfEaseResult;
  granularity?: GranularityResult;
  accessibility?: AccessibilityResult;
}

/**
 * Calculate compliance risk score based on violations
 * 
 * Score ranges:
 * - 0-29: A (Excellent compliance)
 * - 30-49: B (Good compliance)
 * - 50-69: C (Moderate risk)
 * - 70-89: D (High risk)
 * - 90-100: F (Critical risk)
 * 
 * 2026 UPDATE: Includes GPC violations, UI bias detection, and GDPR 2026 Module
 */
export function calculateRiskScore(
  violations: RequestLog[],
  totalRequests: number,
  hasCMP: boolean,
  siteViolations?: string[],
  gdprAudit?: GDPRAuditResult
): number {
  if (violations.length === 0 && (!siteViolations || siteViolations.length === 0) && !gdprAudit) {
    return hasCMP ? 20 : 40; // Good score if no violations
  }

  let score = 50; // Start at moderate risk

  // Factor 1: Number of violations (0-30 points)
  const violationRatio = violations.length / totalRequests;
  if (violationRatio > 0.5) {
    score += 30; // More than 50% are violations
  } else if (violationRatio > 0.3) {
    score += 20;
  } else if (violationRatio > 0.1) {
    score += 10;
  }

  // Factor 2: Type of data being collected (0-20 points)
  const hasPII = violations.some(v => 
    v.dataTypes.some(dt => 
      dt.includes('ID') || 
      dt.includes('Email') || 
      dt.includes('IP Address') ||
      dt.includes('Fingerprint')
    )
  );
  
  if (hasPII) {
    score += 20; // PII collection is serious
  }

  // Factor 3: CMP presence (0-10 points)
  if (!hasCMP) {
    score += 10; // No CMP is a major issue
  }

  // Factor 4: Volume of data (0-10 points)
  const totalDataTypes = violations.reduce((sum, v) => sum + v.dataTypes.length, 0);
  if (totalDataTypes > 10) {
    score += 10; // High volume of data collection
  } else if (totalDataTypes > 5) {
    score += 5;
  }

  // NEW: Factor 5: 2026 Compliance Violations (0-20 points)
  if (siteViolations && siteViolations.length > 0) {
    // GPC_IGNORED is a critical CCPA violation (2026 enforcement)
    if (siteViolations.some(v => v.includes('GPC_IGNORED'))) {
      score += 15; // Major violation
    }
    
    // UI_BIAS_DETECTED is an EDPB dark pattern violation
    if (siteViolations.some(v => v.includes('UI_BIAS_DETECTED'))) {
      score += 10; // Significant violation
    }
    
    // VISUAL_CONFIRMATION_MISSING (if we add it)
    if (siteViolations.some(v => v.includes('VISUAL_CONFIRMATION_MISSING'))) {
      score += 5;
    }
  }

  // NEW: Factor 6 - GDPR 2026 Module Violations (0-60 points)
  if (gdprAudit) {
    console.log('[SCORING] Applying GDPR 2026 penalties...');
    
    // 1. Parity of Ease (0-30 points) - CRITICAL
    // Missing first-layer reject = automatic HIGH RISK
    if (gdprAudit.parityOfEase && !gdprAudit.parityOfEase.firstLayerRejectVisible) {
      score += 30;
      console.log('[SCORING] +30 points: No first-layer Reject button (EDPB Guidelines 05/2020)');
    }
    
    // 2. Pre-Ticked Toggles (0-20 points) - CRITICAL
    // Article 7 GDPR: Consent must be freely given
    if (gdprAudit.granularity?.preTickedNonEssential) {
      const penalty = gdprAudit.granularity.violationSeverity === 'MAJOR' ? 20 : 10;
      score += penalty;
      console.log(`[SCORING] +${penalty} points: Pre-ticked non-essential toggles (Article 7 GDPR)`);
    }
    
    // 3. Data Residency (0-10 points)
    // Cross-border transfers to non-adequate countries
    const nonAdequateTransfers = violations.filter(v => 
      v.dataResidency?.adequacyStatus === 'NON_ADEQUATE'
    ).length;
    
    if (nonAdequateTransfers > 0) {
      const penalty = Math.min(10, nonAdequateTransfers * 2);
      score += penalty;
      console.log(`[SCORING] +${penalty} points: ${nonAdequateTransfers} non-adequate data transfer(s) (Article 44-49 GDPR)`);
    }
    
    // 4. Accessibility (0-5 points)
    // European Accessibility Act (EAA) 2025
    if (gdprAudit.accessibility && !gdprAudit.accessibility.wcag22Compliant) {
      score += 5;
      console.log('[SCORING] +5 points: WCAG 2.2 accessibility failure (EAA 2025)');
    }
  }

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Estimate GDPR fine range based on violations
 * 
 * This is a rough estimate. Real fines depend on:
 * - Company size and revenue
 * - Number of data subjects affected
 * - Nature of violation
 * - Duration of non-compliance
 * - Previous violations
 * - Cooperation with authorities
 */
export function estimateFineRange(
  violations: RequestLog[],
  riskScore: number
): { min: number; max: number } {
  const violationCount = violations.length;
  
  // If no violations, return 0
  if (violationCount === 0) {
    return { min: 0, max: 0 };
  }

  // Base minimum (lower tier GDPR violation)
  let min = 50000; // €50,000
  let max = 200000; // €200,000

  // Adjust based on number of violations
  max = Math.min(2000000, 50000 + (violationCount * 150000)); // Cap at €2M for estimate

  // Adjust based on risk score
  if (riskScore >= 90) {
    min = 200000;
    max = Math.min(5000000, max * 2); // Higher tier violations
  } else if (riskScore >= 70) {
    min = 100000;
    max = Math.min(2000000, max * 1.5);
  }

  // Consider PII collection
  const hasPII = violations.some(v => 
    v.dataTypes.some(dt => 
      dt.includes('ID') || dt.includes('Email') || dt.includes('IP Address')
    )
  );
  
  if (hasPII) {
    max = Math.min(5000000, max * 1.5);
  }

  return { min: Math.round(min), max: Math.round(max) };
}

/**
 * Get letter grade from score
 */
export function getScoreLetter(score: number): string {
  if (score >= 90) return 'F';
  if (score >= 70) return 'D';
  if (score >= 50) return 'C';
  if (score >= 30) return 'B';
  return 'A';
}

