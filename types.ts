
export type Page = 'home' | 'enterprise' | 'docs' | 'privacy' | 'terms' | 'security' | 'impressum';

export interface RequestLog {
  id: string;
  domain: string;
  url: string;
  timestamp: number;
  type: 'pixel' | 'script' | 'xhr';
  status: 'allowed' | 'violation' | 'GPC_IGNORED' | 'VISUAL_CONFIRMATION_MISSING' | 'UI_BIAS_DETECTED';
  dataTypes: string[];
  parameters?: Record<string, string>;
  consentState: 'pre-consent' | 'post-consent'; // Tagged based on consentClickTimestamp
  decodedPayload?: ParsedBeacon;
  legalJustification?: string;
  discrepancyScore?: number;
  dataResidency?: DataResidencyInfo; // GDPR 2026: Cross-border transfer tracking
}

export enum BeaconType {
  ADOBE = 'Adobe Analytics',
  GA4 = 'Google Analytics 4',
  META = 'Meta (Facebook) Pixel',
  TIKTOK = 'TikTok Pixel',
  UNKNOWN = 'Unknown'
}

export interface ParameterInfo {
  key: string;
  value: string;
  friendlyName?: string;
  description?: string;
  category: ParameterCategory;
  isMandatory?: boolean;
}

export enum ParameterCategory {
  CORE = 'Core Configuration',
  TRAFFIC = 'Traffic Sources',
  ECOMMERCE = 'E-commerce',
  CUSTOM = 'Custom Dimensions/Variables',
  SYSTEM = 'System/Environment',
  USER = 'User Data',
  OTHER = 'Other'
}

export interface ParsedBeacon {
  id: string;
  type: BeaconType;
  rawUrl: string;
  parameters: ParameterInfo[];
  errors: string[];
  dataResidency?: DataResidencyInfo; // GDPR 2026: Cross-border transfer tracking
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  riskScore: number;
  violationsCount: number;
  compliantCount: number;
  consentBannerDetected: boolean;
  bannerProvider?: string;
  requests: RequestLog[];
  screenshots: {
    before: string;
    beforeHash: string;        // SHA-256 for tamper evidence
    beforeCapturedAt: string;  // ISO 8601 timestamp
    after: string;
    afterHash: string;         // SHA-256 for tamper evidence
    afterCapturedAt: string;   // ISO 8601 timestamp
  };
  dataLayers: string[];
  tmsDetected: string[];
  fineRange?: {
    min: number;
    max: number;
  };
  scanMethod?: 'network' | 'html_analysis';
  scanNote?: string;
  detectionDetails?: {
    tmsEvidence?: string[];
    tmsDetectionSource?: {
      html?: boolean;
      scriptUrls?: string[];
      inlineScripts?: boolean;
      specificPatterns?: string[];
    };
    dataLayerEvidence?: string[];
    dataLayerDetectionSource?: {
      html?: boolean;
      scriptUrls?: string[];
      inlineScripts?: boolean;
      specificPatterns?: string[];
    };
    analyticsConfiguration?: {
      adobeConfiguration?: {
        launchScriptUrl?: string;
        amcvId?: string;
        targetToken?: string;
        dataLayerName?: string;
      };
      gtmConfiguration?: {
        containerId?: string;
        dataLayerName?: string;
      };
      detectedTechnologies?: string[];
    };
  };
  performanceMetrics?: {
    totalDuration: number;
    browserLaunch: number;
    navigation: number;
    bannerDetection: number;
    consentInteraction: number;
    postConsentWait: number;
    detectionAnalysis: number;
    geminiAnalysis: number;
    networkProcessing: number;
  };
  aiVerdicts?: AIVerdict[];
  // NEW: 2026 Compliance Audits
  gpcAudit?: VisionAuditResult;
  symmetryAudit?: SymmetryAuditResult;
  gpcSignalSent?: boolean;
  siteViolations?: string[];
  // GDPR 2026 Audit Module
  gdprAudit?: {
    parityOfEase?: ParityOfEaseResult;
    granularity?: GranularityResult;
    accessibility?: AccessibilityResult;
    transparency?: TransparencyResult;
  };
  dataResidencyViolations?: DataResidencyInfo[];
  certificate?: ComplianceCertificate;
}

export interface AIAnalysis {
  summary: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  remediationSteps: {
    title: string;
    description: string;
    priority: 'Immediate' | 'Next' | 'Soon';
  }[];
  legalContext: string;
  disclaimer: string;
}

export interface BeaconAnalysis {
  classification: string;
  dataExfiltration: string;
  forensicEvidence: string;
  remediation: string;
}

// AI-powered Batch Audit Verdicts
export interface AIVerdict {
  requestId: string;
  // Human-readable trace context for DPO traceability
  traceId: string;        // e.g., "adobe_analytics_fingerprint_metrics_dertour_de"
  targetDomain: string;   // e.g., "metrics.dertour.de"
  vendorType: string;     // e.g., "Adobe Analytics"
  purpose: string;        // e.g., "Fingerprinting"
  riskLevel: 'High' | 'Medium' | 'Low';
  violationType: 'PII Leak' | 'Granular Tracking' | 'Fingerprinting' | 'None';
  explanation: string;
}

// GPC Vision Audit Result
export interface VisionAuditResult {
  detected: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  rawResponse?: string;
}

// UI Symmetry Audit Result
export interface SymmetryAuditResult {
  acceptButton: { width: number; height: number; x: number; y: number };
  rejectButton: { width: number; height: number; x: number; y: number };
  sizeRatio: number; // 1.0 = equal, >1.5 = biased toward Accept
  positionBias: 'ACCEPT_RIGHT' | 'REJECT_RIGHT' | 'EQUAL';
  overallVerdict: 'SYMMETRIC' | 'MINOR_BIAS' | 'MAJOR_BIAS';
  score: number; // 0-100, where 100 = perfectly symmetric
}

// GDPR 2026 Audit Module Types
export interface ParityOfEaseResult {
  firstLayerRejectVisible: boolean;
  rejectButtonLocation: 'FIRST_LAYER' | 'SECOND_LAYER' | 'NOT_FOUND';
  rejectButtonText?: string;
  requiresExtraClicks: boolean;
  clicksToReject: number;
  evidence: string;
}

export interface ToggleInfo {
  label: string;
  category: 'NECESSARY' | 'ANALYTICS' | 'MARKETING' | 'PERSONALIZATION' | 'UNKNOWN';
  isPreTicked: boolean;
  isDisabled: boolean;
}

export interface GranularityResult {
  hasGranularControls: boolean;
  toggles: ToggleInfo[];
  preTickedNonEssential: boolean;
  preTickedCount: number;
  violationSeverity: 'NONE' | 'MINOR' | 'MAJOR';
  evidence: string;
}

export interface AccessibilityResult {
  wcag22Compliant: boolean;
  contrastChecks: {
    acceptButton: { ratio: number; passes: boolean };
    rejectButton: { ratio: number; passes: boolean };
  };
  ariaLabels: {
    acceptButton: { hasLabel: boolean; label?: string };
    rejectButton: { hasLabel: boolean; label?: string };
  };
  keyboardNavigable: boolean;
  violations: string[];
  score: number; // 0-100 overall score
  // EAA 2025/2026: POUR Principle Breakdown
  pourScores: {
    perceivable: number;    // 0-100 (contrast, text size, focus indicators)
    operable: number;       // 0-100 (keyboard nav, target size, tab order)
    understandable: number; // 0-100 (language attributes, consistent labeling)
    robust: number;         // 0-100 (ARIA roles, valid HTML)
  };
}

export interface TransparencyResult {
  hasDataCategories: boolean;
  hasThirdPartyList: boolean;
  dataCategoriesFound: string[];
  thirdPartiesFound: string[];
  articleCompliance: 'FULL' | 'PARTIAL' | 'NONE';
  evidence: string;
  rawResponse?: string;
}

export interface DataResidencyInfo {
  requestDomain: string;
  resolvedIP?: string;
  country?: string;
  countryCode?: string;
  isEEA: boolean;
  adequacyStatus: 'EEA' | 'ADEQUATE' | 'NON_ADEQUATE' | 'UNKNOWN';
}

// Compliance Certificate Types (for legal evidence)
export interface ComplianceCertificate {
  version: '1.0';
  type: 'SCAN_SUMMARY' | 'EVIDENCE_CHAIN' | 'ATTESTATION';
  
  metadata: {
    certificateId: string;        // UUID v4
    generatedAt: string;          // ISO 8601
    validUntil: string;           // +30 days
    generatedBy: string;          // 'Consentinel v2.1.0'
    signatureAlgorithm: 'SHA256withECDSA' | 'NONE';
  };
  
  subject: {
    url: string;
    scanId: string;
    scanTimestamp: string;
  };
  
  findings: {
    overallScore: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';
    violationsCount: number;
    violations: {
      code: string;
      article: string;
      severity: string;
      evidence: string;
    }[];
  };
  
  evidence: {
    screenshotHashes: {
      before: string;
      beforeCapturedAt: string;
      after: string;
      afterCapturedAt: string;
    };
    requestLogHash: string;
    auditTrailHash: string;
  };
  
  signature?: {
    algorithm: 'SHA256withECDSA';
    publicKey: string;
    signature: string;
    timestamp: string;
  };
}
