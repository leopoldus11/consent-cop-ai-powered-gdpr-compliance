
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
