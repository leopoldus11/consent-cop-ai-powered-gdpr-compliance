/**
 * CertificateGenerator.ts
 * Generates cryptographically verifiable compliance certificates
 * 
 * Certificate Types:
 * 1. SCAN_SUMMARY - JSON certificate with scan findings
 * 2. EVIDENCE_CHAIN - JSON with SHA-256 hashes for chain of custody
 * 3. ATTESTATION - PDF with digital signature (optional)
 * 
 * Use Case: DPOs can present these to auditors as legal evidence
 */

import { createHash } from 'crypto';
import { ComplianceCertificate, ScanResult } from '../types';
import { REGULATORY_CITATIONS, getCitationsForViolation } from '../constants/RegulatoryDB';

/**
 * Generate a UUID v4 (simple implementation)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Determine risk level from risk score
 */
function getRiskLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT' {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 30) return 'LOW';
  return 'COMPLIANT';
}

/**
 * Hash a JSON object for evidence integrity
 */
function hashObject(obj: any): string {
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Generate a Scan Summary Certificate
 * Includes all findings with regulatory citations
 */
export function generateScanSummaryCertificate(scanResult: ScanResult): ComplianceCertificate {
  console.log('[CERTIFICATE] Generating Scan Summary Certificate...');

  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  // Map violations to regulatory citations
  const violations = [];
  
  // Parity of Ease violation
  if (scanResult.gdprAudit?.parityOfEase && !scanResult.gdprAudit.parityOfEase.firstLayerRejectVisible) {
    const citations = getCitationsForViolation('GDPR_PARITY_VIOLATION');
    citations.forEach(citation => {
      violations.push({
        code: citation.code,
        article: citation.article,
        severity: citation.severity,
        evidence: scanResult.gdprAudit!.parityOfEase!.evidence
      });
    });
  }

  // GPC violation
  if (scanResult.siteViolations?.some(v => v.includes('GPC_IGNORED'))) {
    const citations = getCitationsForViolation('GPC_IGNORED');
    citations.forEach(citation => {
      violations.push({
        code: citation.code,
        article: citation.article,
        severity: citation.severity,
        evidence: 'GPC signal sent but no visual confirmation detected'
      });
    });
  }

  // Pre-ticked toggles
  if (scanResult.gdprAudit?.granularity?.preTickedNonEssential) {
    const citations = getCitationsForViolation('PRE_TICKED_TOGGLES');
    citations.forEach(citation => {
      violations.push({
        code: citation.code,
        article: citation.article,
        severity: citation.severity,
        evidence: scanResult.gdprAudit!.granularity!.evidence
      });
    });
  }

  // Transparency violations
  if (scanResult.gdprAudit?.transparency) {
    if (!scanResult.gdprAudit.transparency.hasThirdPartyList) {
      const citations = getCitationsForViolation('NO_THIRD_PARTY_DISCLOSURE');
      citations.forEach(citation => {
        violations.push({
          code: citation.code,
          article: citation.article,
          severity: citation.severity,
          evidence: 'No specific third-party recipients disclosed in consent banner'
        });
      });
    }
  }

  // Data residency violations
  if (scanResult.dataResidencyViolations && scanResult.dataResidencyViolations.length > 0) {
    const citations = getCitationsForViolation('NON_ADEQUATE_TRANSFER');
    citations.forEach(citation => {
      violations.push({
        code: citation.code,
        article: citation.article,
        severity: citation.severity,
        evidence: `Data transferred to non-adequate countries: ${scanResult.dataResidencyViolations!.map(v => v.country).join(', ')}`
      });
    });
  }

  // Accessibility violations
  if (scanResult.gdprAudit?.accessibility && !scanResult.gdprAudit.accessibility.wcag22Compliant) {
    scanResult.gdprAudit.accessibility.violations.forEach(violation => {
      if (violation.includes('contrast')) {
        const citations = getCitationsForViolation('WCAG_CONTRAST_FAILURE');
        citations.forEach(citation => {
          violations.push({
            code: citation.code,
            article: citation.article,
            severity: citation.severity,
            evidence: violation
          });
        });
      } else if (violation.includes('keyboard')) {
        const citations = getCitationsForViolation('KEYBOARD_INACCESSIBLE');
        citations.forEach(citation => {
          violations.push({
            code: citation.code,
            article: citation.article,
            severity: citation.severity,
            evidence: violation
          });
        });
      } else if (violation.includes('label')) {
        const citations = getCitationsForViolation('MISSING_ARIA');
        citations.forEach(citation => {
          violations.push({
            code: citation.code,
            article: citation.article,
            severity: citation.severity,
            evidence: violation
          });
        });
      }
    });
  }

  // Hash the request logs for evidence integrity
  const requestLogHash = hashObject(scanResult.requests);
  const auditTrailHash = hashObject({
    gpcAudit: scanResult.gpcAudit,
    symmetryAudit: scanResult.symmetryAudit,
    gdprAudit: scanResult.gdprAudit
  });

  const certificate: ComplianceCertificate = {
    version: '1.0',
    type: 'SCAN_SUMMARY',
    metadata: {
      certificateId: generateUUID(),
      generatedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      generatedBy: 'Consentinel v2.1.0',
      signatureAlgorithm: 'NONE'
    },
    subject: {
      url: scanResult.url,
      scanId: scanResult.id,
      scanTimestamp: scanResult.timestamp
    },
    findings: {
      overallScore: scanResult.riskScore,
      riskLevel: getRiskLevel(scanResult.riskScore),
      violationsCount: violations.length,
      violations
    },
    evidence: {
      screenshotHashes: {
        before: scanResult.screenshots.beforeHash,
        beforeCapturedAt: scanResult.screenshots.beforeCapturedAt,
        after: scanResult.screenshots.afterHash,
        afterCapturedAt: scanResult.screenshots.afterCapturedAt
      },
      requestLogHash,
      auditTrailHash
    }
  };

  console.log(`[CERTIFICATE] Certificate ID: ${certificate.metadata.certificateId}`);
  console.log(`[CERTIFICATE] Risk Level: ${certificate.findings.riskLevel}`);
  console.log(`[CERTIFICATE] Violations: ${violations.length}`);

  return certificate;
}

/**
 * Generate Evidence Chain Certificate
 * Focused on cryptographic hashes for chain of custody
 */
export function generateEvidenceChainCertificate(scanResult: ScanResult): ComplianceCertificate {
  console.log('[CERTIFICATE] Generating Evidence Chain Certificate...');

  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const requestLogHash = hashObject(scanResult.requests);
  const auditTrailHash = hashObject({
    gpcAudit: scanResult.gpcAudit,
    symmetryAudit: scanResult.symmetryAudit,
    gdprAudit: scanResult.gdprAudit
  });

  const certificate: ComplianceCertificate = {
    version: '1.0',
    type: 'EVIDENCE_CHAIN',
    metadata: {
      certificateId: generateUUID(),
      generatedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      generatedBy: 'Consentinel v2.1.0',
      signatureAlgorithm: 'NONE'
    },
    subject: {
      url: scanResult.url,
      scanId: scanResult.id,
      scanTimestamp: scanResult.timestamp
    },
    findings: {
      overallScore: scanResult.riskScore,
      riskLevel: getRiskLevel(scanResult.riskScore),
      violationsCount: scanResult.violationsCount,
      violations: [] // Evidence chain doesn't include detailed violations
    },
    evidence: {
      screenshotHashes: {
        before: scanResult.screenshots.beforeHash,
        beforeCapturedAt: scanResult.screenshots.beforeCapturedAt,
        after: scanResult.screenshots.afterHash,
        afterCapturedAt: scanResult.screenshots.afterCapturedAt
      },
      requestLogHash,
      auditTrailHash
    }
  };

  console.log(`[CERTIFICATE] Evidence Chain Certificate ID: ${certificate.metadata.certificateId}`);
  console.log(`[CERTIFICATE] Screenshot Before Hash: ${certificate.evidence.screenshotHashes.before.substring(0, 16)}...`);
  console.log(`[CERTIFICATE] Screenshot After Hash: ${certificate.evidence.screenshotHashes.after.substring(0, 16)}...`);
  console.log(`[CERTIFICATE] Request Log Hash: ${requestLogHash.substring(0, 16)}...`);

  return certificate;
}

/**
 * Export certificate as JSON string
 */
export function exportCertificateJSON(certificate: ComplianceCertificate): string {
  return JSON.stringify(certificate, null, 2);
}

/**
 * Verify certificate integrity
 * Checks if hashes match the original scan data
 */
export function verifyCertificate(
  certificate: ComplianceCertificate,
  scanResult: ScanResult
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verify screenshot hashes
  if (certificate.evidence.screenshotHashes.before !== scanResult.screenshots.beforeHash) {
    errors.push('Screenshot BEFORE hash mismatch - evidence may be tampered');
  }

  if (certificate.evidence.screenshotHashes.after !== scanResult.screenshots.afterHash) {
    errors.push('Screenshot AFTER hash mismatch - evidence may be tampered');
  }

  // Verify request log hash
  const currentRequestLogHash = hashObject(scanResult.requests);
  if (certificate.evidence.requestLogHash !== currentRequestLogHash) {
    errors.push('Request log hash mismatch - data integrity compromised');
  }

  // Verify audit trail hash
  const currentAuditTrailHash = hashObject({
    gpcAudit: scanResult.gpcAudit,
    symmetryAudit: scanResult.symmetryAudit,
    gdprAudit: scanResult.gdprAudit
  });
  if (certificate.evidence.auditTrailHash !== currentAuditTrailHash) {
    errors.push('Audit trail hash mismatch - findings may be altered');
  }

  // Check certificate expiration
  const now = new Date();
  const validUntil = new Date(certificate.metadata.validUntil);
  if (now > validUntil) {
    errors.push(`Certificate expired on ${certificate.metadata.validUntil}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate estimated fine exposure from certificate
 */
export function calculateFineExposure(certificate: ComplianceCertificate, annualRevenue?: number): {
  minFine: number;
  maxFine: number;
  currency: string;
} {
  let minFine = 0;
  let maxFine = 0;

  certificate.findings.violations.forEach(violation => {
    const citation = REGULATORY_CITATIONS[violation.code];
    if (citation) {
      minFine += citation.fineBase * 0.5; // Conservative estimate

      if (citation.fineMultiplier && annualRevenue) {
        const percentageFine = annualRevenue * citation.fineMultiplier;
        maxFine += Math.max(citation.fineBase, percentageFine);
      } else {
        maxFine += citation.fineBase;
      }
    }
  });

  return {
    minFine: Math.round(minFine),
    maxFine: Math.round(maxFine),
    currency: 'EUR'
  };
}

