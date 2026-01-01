import { RequestLog } from '../types.js';

/**
 * Calculate compliance risk score based on violations
 * 
 * Score ranges:
 * - 0-29: A (Excellent compliance)
 * - 30-49: B (Good compliance)
 * - 50-69: C (Moderate risk)
 * - 70-89: D (High risk)
 * - 90-100: F (Critical risk)
 */
export function calculateRiskScore(
  violations: RequestLog[],
  totalRequests: number,
  hasCMP: boolean
): number {
  if (violations.length === 0) {
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

