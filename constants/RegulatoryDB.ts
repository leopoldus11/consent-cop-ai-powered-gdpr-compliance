/**
 * RegulatoryDB.ts
 * Comprehensive database of regulatory citations for violation mapping
 * 
 * Each citation includes:
 * - Regulation type (GDPR, CCPA, EDPB, EAA)
 * - Article/section reference
 * - Title and description
 * - Fine amounts and enforcement dates
 * - Severity classification
 */

export interface RegulatoryCitation {
  code: string;
  regulation: 'GDPR' | 'CCPA' | 'EDPB' | 'EAA' | 'CPRA';
  article: string;
  title: string;
  description: string;
  fineBase: number;
  fineMultiplier?: number; // For percentage-based fines (e.g., 4% of revenue)
  enforcementDate: string;  // ISO 8601
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  legalReference: string;   // Official document URL
}

/**
 * Comprehensive Regulatory Citation Database
 * Updated for 2026 enforcement priorities
 */
export const REGULATORY_CITATIONS: Record<string, RegulatoryCitation> = {
  // ============================================
  // CCPA / CPRA (California)
  // ============================================
  
  'CCPA-999315H': {
    code: 'CCPA-999315H',
    regulation: 'CCPA',
    article: '§999.315(h)',
    title: 'GPC Signal Must Be Honored',
    description: 'A business that receives a Global Privacy Control (GPC) signal shall process it as a valid opt-out of sale/sharing request.',
    fineBase: 7500,
    enforcementDate: '2026-01-01',
    severity: 'CRITICAL',
    legalReference: 'https://cppa.ca.gov/regulations/'
  },
  
  'CCPA-1798135A': {
    code: 'CCPA-1798135A',
    regulation: 'CCPA',
    article: '§1798.135(a)',
    title: 'Clear Opt-Out Link Required',
    description: 'A business that sells or shares personal information must provide a clear "Do Not Sell or Share My Personal Information" link on its homepage.',
    fineBase: 7500,
    enforcementDate: '2023-01-01',
    severity: 'HIGH',
    legalReference: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.135'
  },
  
  'CCPA-1798155': {
    code: 'CCPA-1798155',
    regulation: 'CCPA',
    article: '§1798.155(b)',
    title: 'Intentional Violation Penalty',
    description: 'Intentional violations subject to civil penalty up to $7,500 per violation.',
    fineBase: 7500,
    enforcementDate: '2020-01-01',
    severity: 'CRITICAL',
    legalReference: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.155'
  },

  // ============================================
  // GDPR (European Union)
  // ============================================
  
  'GDPR-7-1': {
    code: 'GDPR-7-1',
    regulation: 'GDPR',
    article: 'Art. 7(1)',
    title: 'Consent Must Be Demonstrable',
    description: 'The controller shall be able to demonstrate that the data subject has consented to processing of their personal data.',
    fineBase: 20000000,
    fineMultiplier: 0.04, // 4% of annual global turnover
    enforcementDate: '2018-05-25',
    severity: 'CRITICAL',
    legalReference: 'https://gdpr-info.eu/art-7-gdpr/'
  },
  
  'GDPR-7-4': {
    code: 'GDPR-7-4',
    regulation: 'GDPR',
    article: 'Art. 7(4)',
    title: 'Consent Not Freely Given',
    description: 'Pre-ticked boxes do not constitute valid consent. Consent must be freely given, specific, informed and unambiguous.',
    fineBase: 20000000,
    fineMultiplier: 0.04,
    enforcementDate: '2018-05-25',
    severity: 'CRITICAL',
    legalReference: 'https://gdpr-info.eu/art-7-gdpr/'
  },
  
  'GDPR-13-1-C': {
    code: 'GDPR-13-1-C',
    regulation: 'GDPR',
    article: 'Art. 13(1)(c)',
    title: 'Purpose Specification Required',
    description: 'Controller must inform data subjects of the purposes of processing and the legal basis for processing.',
    fineBase: 10000000,
    fineMultiplier: 0.02,
    enforcementDate: '2018-05-25',
    severity: 'HIGH',
    legalReference: 'https://gdpr-info.eu/art-13-gdpr/'
  },
  
  'GDPR-13-1-E': {
    code: 'GDPR-13-1-E',
    regulation: 'GDPR',
    article: 'Art. 13(1)(e)',
    title: 'Recipients of Personal Data',
    description: 'Controller must inform data subjects of the recipients or categories of recipients of the personal data.',
    fineBase: 10000000,
    fineMultiplier: 0.02,
    enforcementDate: '2018-05-25',
    severity: 'HIGH',
    legalReference: 'https://gdpr-info.eu/art-13-gdpr/'
  },
  
  'GDPR-13-1-F': {
    code: 'GDPR-13-1-F',
    regulation: 'GDPR',
    article: 'Art. 13(1)(f)',
    title: 'Third-Country Transfer Disclosure',
    description: 'Controller must inform data subjects of transfers to third countries and the appropriate safeguards (SCCs, DPF, BCRs).',
    fineBase: 10000000,
    fineMultiplier: 0.02,
    enforcementDate: '2018-05-25',
    severity: 'HIGH',
    legalReference: 'https://gdpr-info.eu/art-13-gdpr/'
  },
  
  'GDPR-44': {
    code: 'GDPR-44',
    regulation: 'GDPR',
    article: 'Art. 44',
    title: 'General Principle for Transfers',
    description: 'Any transfer to a third country may only take place if conditions of Chapter V are complied with.',
    fineBase: 20000000,
    fineMultiplier: 0.04,
    enforcementDate: '2018-05-25',
    severity: 'CRITICAL',
    legalReference: 'https://gdpr-info.eu/art-44-gdpr/'
  },

  // ============================================
  // EDPB (European Data Protection Board)
  // ============================================
  
  'EDPB-052020-3': {
    code: 'EDPB-052020-3',
    regulation: 'EDPB',
    article: 'Guidelines 05/2020 §3',
    title: 'Parity of Ease (Dark Pattern)',
    description: 'Refusing consent must be as easy as accepting it. No first-layer reject button is a prohibited dark pattern.',
    fineBase: 5000000,
    enforcementDate: '2020-05-04',
    severity: 'HIGH',
    legalReference: 'https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en'
  },
  
  'EDPB-032022-1': {
    code: 'EDPB-032022-1',
    regulation: 'EDPB',
    article: 'Guidelines 03/2022 §1',
    title: 'Dark Patterns - Visual Obstruction',
    description: 'Making the reject option less visible or prominent than accept option is a prohibited dark pattern.',
    fineBase: 3000000,
    enforcementDate: '2022-03-14',
    severity: 'MEDIUM',
    legalReference: 'https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32022-dark-patterns-social-media-platform_en'
  },
  
  'EDPB-032022-2': {
    code: 'EDPB-032022-2',
    regulation: 'EDPB',
    article: 'Guidelines 03/2022 §2',
    title: 'Dark Patterns - Misleading Language',
    description: 'Using language like "Continue to site" when it means "Accept All" is deceptive and prohibited.',
    fineBase: 2000000,
    enforcementDate: '2022-03-14',
    severity: 'MEDIUM',
    legalReference: 'https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32022-dark-patterns-social-media-platform_en'
  },

  // ============================================
  // EAA (European Accessibility Act)
  // ============================================
  
  'EAA-301549-9-4-2': {
    code: 'EAA-301549-9-4-2',
    regulation: 'EAA',
    article: 'EN 301 549 §9.4.2',
    title: 'Color Contrast Requirement (Perceivable)',
    description: 'Interactive elements must have at least 4.5:1 contrast ratio for normal text (WCAG 2.2 AA).',
    fineBase: 100000, // National implementation varies
    enforcementDate: '2025-06-28',
    severity: 'MEDIUM',
    legalReference: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf'
  },
  
  'EAA-301549-9-2-1': {
    code: 'EAA-301549-9-2-1',
    regulation: 'EAA',
    article: 'EN 301 549 §9.2.1',
    title: 'Keyboard Accessibility (Operable)',
    description: 'All functionality must be operable through a keyboard interface without requiring specific timings.',
    fineBase: 100000,
    enforcementDate: '2025-06-28',
    severity: 'MEDIUM',
    legalReference: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf'
  },
  
  'EAA-301549-9-3-1': {
    code: 'EAA-301549-9-3-1',
    regulation: 'EAA',
    article: 'EN 301 549 §9.3.1',
    title: 'Language Identification (Understandable)',
    description: 'Default human language of each web page can be programmatically determined.',
    fineBase: 50000,
    enforcementDate: '2025-06-28',
    severity: 'LOW',
    legalReference: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf'
  },
  
  'EAA-301549-9-4-1': {
    code: 'EAA-301549-9-4-1',
    regulation: 'EAA',
    article: 'EN 301 549 §9.4.1',
    title: 'Valid HTML and ARIA (Robust)',
    description: 'Markup must be valid and ARIA roles must be correctly implemented.',
    fineBase: 75000,
    enforcementDate: '2025-06-28',
    severity: 'LOW',
    legalReference: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf'
  },

  // ============================================
  // CPRA (California Privacy Rights Act)
  // ============================================
  
  'CPRA-1798121': {
    code: 'CPRA-1798121',
    regulation: 'CPRA',
    article: '§1798.121',
    title: 'Right to Limit Sensitive Personal Information',
    description: 'Consumer has right to limit use and disclosure of sensitive personal information.',
    fineBase: 7500,
    enforcementDate: '2023-01-01',
    severity: 'HIGH',
    legalReference: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.121'
  }
};

/**
 * Get citation by code
 */
export function getCitation(code: string): RegulatoryCitation | undefined {
  return REGULATORY_CITATIONS[code];
}

/**
 * Find citations by regulation type
 */
export function getCitationsByRegulation(regulation: 'GDPR' | 'CCPA' | 'EDPB' | 'EAA' | 'CPRA'): RegulatoryCitation[] {
  return Object.values(REGULATORY_CITATIONS).filter(c => c.regulation === regulation);
}

/**
 * Find citations by severity
 */
export function getCitationsBySeverity(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): RegulatoryCitation[] {
  return Object.values(REGULATORY_CITATIONS).filter(c => c.severity === severity);
}

/**
 * Calculate maximum fine for a violation
 */
export function calculateMaxFine(code: string, annualRevenue?: number): number {
  const citation = getCitation(code);
  if (!citation) return 0;

  if (citation.fineMultiplier && annualRevenue) {
    const percentageFine = annualRevenue * citation.fineMultiplier;
    return Math.max(citation.fineBase, percentageFine);
  }

  return citation.fineBase;
}

/**
 * Map violation types to regulatory citations
 */
export const VIOLATION_TO_CITATION_MAP: Record<string, string[]> = {
  'GPC_IGNORED': ['CCPA-999315H', 'CCPA-1798155'],
  'GDPR_PARITY_VIOLATION': ['EDPB-052020-3', 'GDPR-7-1'],
  'UI_BIAS_DETECTED': ['EDPB-032022-1', 'EDPB-032022-2'],
  'PRE_TICKED_TOGGLES': ['GDPR-7-4', 'GDPR-7-1'],
  'NO_THIRD_PARTY_DISCLOSURE': ['GDPR-13-1-E', 'GDPR-13-1-F'],
  'NO_PURPOSE_SPECIFICATION': ['GDPR-13-1-C'],
  'NON_ADEQUATE_TRANSFER': ['GDPR-44', 'GDPR-13-1-F'],
  'WCAG_CONTRAST_FAILURE': ['EAA-301549-9-4-2'],
  'KEYBOARD_INACCESSIBLE': ['EAA-301549-9-2-1'],
  'MISSING_ARIA': ['EAA-301549-9-4-1']
};

/**
 * Get all applicable citations for a violation type
 */
export function getCitationsForViolation(violationType: string): RegulatoryCitation[] {
  const codes = VIOLATION_TO_CITATION_MAP[violationType] || [];
  return codes.map(code => getCitation(code)).filter(c => c !== undefined) as RegulatoryCitation[];
}

