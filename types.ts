
export type Page = 'home' | 'enterprise' | 'docs' | 'privacy' | 'terms' | 'security' | 'impressum';

export interface RequestLog {
  id: string;
  domain: string;
  url: string;
  timestamp: number;
  type: 'pixel' | 'script' | 'xhr';
  status: 'allowed' | 'violation';
  dataTypes: string[];
  parameters?: Record<string, string>;
  consentState: 'pre-consent' | 'post-consent'; // Tagged based on consentClickTimestamp
  decodedPayload?: ParsedBeacon;
  legalJustification?: string;
  discrepancyScore?: number;
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
    after: string;
  };
  dataLayers: string[];
  tmsDetected: string[];
  fineRange?: {
    min: number;
    max: number;
  };
  scanMethod?: 'network' | 'html_analysis'; // How TMS was detected
  scanNote?: string; // Additional note about the scan (e.g., bot detection warning)
  detectionDetails?: {
    tmsEvidence?: string[]; // Evidence for TMS detection
    tmsDetectionSource?: {
      html?: boolean;
      scriptUrls?: string[];
      inlineScripts?: boolean;
      specificPatterns?: string[];
    };
    dataLayerEvidence?: string[]; // Evidence for data layer detection
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
  aiVerdicts?: AIVerdict[]; // Batch AI Audit Results
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
  riskLevel: 'High' | 'Medium' | 'Low';
  violationType: 'PII Leak' | 'Granular Tracking' | 'Fingerprinting' | 'None';
  explanation: string;
}
