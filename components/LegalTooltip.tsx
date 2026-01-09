/**
 * LegalTooltip.tsx
 * 
 * Contextual Intelligence Component
 * Provides DPO-ready legal context for each AI-detected violation type.
 * 
 * For every verdict, explains:
 * 1. What it means technically
 * 2. Which law it violates (GDPR Article, CCPA Section)
 * 3. Why it matters for compliance officers
 */

import React, { useState } from 'react';
import { Info, AlertTriangle, Scale, BookOpen, ExternalLink } from 'lucide-react';

interface LegalContext {
  technicalDefinition: string;
  legalBasis: {
    regulation: 'GDPR' | 'CCPA' | 'EAA' | 'EDPB';
    article: string;
    description: string;
  }[];
  dpoRelevance: string;
  fineRange?: string;
  remediation: string;
}

// Comprehensive legal database for all violation types
const LEGAL_DATABASE: Record<string, LegalContext> = {
  'Fingerprinting': {
    technicalDefinition: 'Browser fingerprinting collects device-specific attributes (canvas hash, WebGL renderer, installed fonts, screen resolution) to create a unique identifier that persists even after cookies are cleared.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 5(1)(a)',
        description: 'Violates lawfulness, fairness, and transparency principles. Fingerprinting occurs without user knowledge.'
      },
      {
        regulation: 'GDPR',
        article: 'Article 6(1)',
        description: 'No valid legal basis. Fingerprinting cannot rely on legitimate interest as it creates persistent cross-site tracking.'
      },
      {
        regulation: 'CCPA',
        article: '§1798.100(a)',
        description: 'Collection of personal information (unique identifier) without notice at or before collection.'
      }
    ],
    dpoRelevance: 'High enforcement priority. CNIL fined Criteo €40M (2023) specifically for fingerprinting without consent. EDPB 2026 Guidelines explicitly classify fingerprinting as requiring opt-in consent.',
    fineRange: '€20,000 - €50,000,000 (GDPR) or $7,500/consumer (CCPA)',
    remediation: 'Remove fingerprinting scripts or gate them behind explicit consent. Implement TCF v2.2 Purpose 10 (Device Scanning) consent collection.'
  },
  
  'PII Leak': {
    technicalDefinition: 'Personally Identifiable Information (email, hashed user ID, device ID, IP address) transmitted to third-party tracking services before valid consent is obtained.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 7(1)',
        description: 'Consent must be demonstrable. Pre-consent PII transmission makes consent retroactive, which is invalid.'
      },
      {
        regulation: 'GDPR',
        article: 'Article 44',
        description: 'If PII is sent to US-based services (Google, Meta), this is an international transfer requiring SCCs or DPF certification.'
      },
      {
        regulation: 'CCPA',
        article: '§1798.120',
        description: 'Right to opt-out of sale/sharing. Pre-consent tracking constitutes "sharing" under CPRA definition.'
      }
    ],
    dpoRelevance: 'Critical risk. Meta Pixel PII cases led to €1.2B fine in 2023. Healthcare/finance sectors face elevated scrutiny under sector-specific regulations.',
    fineRange: '€10,000,000 - €20,000,000 or 4% of global turnover (GDPR)',
    remediation: 'Implement server-side tagging with consent gating. Use Usercentrics Smart Data Protector or OneTrust Script Blocking to prevent pre-consent data transmission.'
  },
  
  'Granular Tracking': {
    technicalDefinition: 'Detailed behavioral data collection (scroll depth, mouse movements, click coordinates, form field interactions, video engagement) that creates a comprehensive user profile.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 5(1)(c)',
        description: 'Data minimization principle. Granular tracking collects far more data than necessary for stated purposes.'
      },
      {
        regulation: 'EDPB',
        article: 'Guidelines 05/2020',
        description: 'Behavioral tracking for advertising requires explicit consent. "Legitimate interest" basis is not applicable.'
      },
      {
        regulation: 'CCPA',
        article: '§1798.100(b)',
        description: 'Collection must be "reasonably necessary." Granular behavioral tracking typically exceeds necessity threshold.'
      }
    ],
    dpoRelevance: 'Growing enforcement focus. Session replay tools (Hotjar, FullStory) are under DPA scrutiny. French CNIL specifically warned against granular tracking in 2024 guidance.',
    fineRange: '€100,000 - €10,000,000 (GDPR)',
    remediation: 'Disable ActivityMap, scroll tracking, and heatmap features until after consent. Configure Adobe Launch / GTM to block these modules pre-consent.'
  },
  
  'CNAME Cloaking': {
    technicalDefinition: 'First-party subdomain (e.g., metrics.example.com) that CNAMEs to third-party tracking infrastructure, bypassing browser third-party cookie restrictions.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 5(1)(a)',
        description: 'Transparency violation. Users cannot identify third-party involvement when tracking appears first-party.'
      },
      {
        regulation: 'EDPB',
        article: 'Opinion 5/2019',
        description: 'CNAME cloaking is explicitly identified as a technique to circumvent consent requirements. Not permissible.'
      },
      {
        regulation: 'CCPA',
        article: '§1798.140(ad)',
        description: 'Deceptive practice under "dark pattern" definition. CPRA 2023 amendments specifically address consent circumvention.'
      }
    ],
    dpoRelevance: 'Emerging enforcement priority. Safari ITP and Firefox ETP now detect and block CNAME cloaking. DPAs view this as intentional circumvention, leading to aggravated fines.',
    fineRange: '€5,000,000 - €20,000,000 (aggravated due to intent)',
    remediation: 'Remove CNAME redirects. Use server-side tracking with proper consent gating instead of CNAME workarounds.'
  },
  
  'GPC Ignored': {
    technicalDefinition: 'Global Privacy Control (navigator.globalPrivacyControl) signal was sent by the browser but the site continued processing tracking requests without honoring the opt-out.',
    legalBasis: [
      {
        regulation: 'CCPA',
        article: '§999.315(h)',
        description: 'Businesses MUST treat GPC as valid opt-out of sale/sharing. Non-compliance is a per-consumer violation as of January 1, 2026.'
      },
      {
        regulation: 'GDPR',
        article: 'Article 21(5)',
        description: 'Automated means of objection (like GPC) should be facilitated. Ignoring GPC may constitute failure to honor objection.'
      }
    ],
    dpoRelevance: 'CRITICAL for US operations. California AG issued first GPC enforcement action (Sephora, 2022). CPPA "Notice to Cure" process now treats GPC non-compliance as automatic violation.',
    fineRange: '$7,500 per intentional violation (CCPA)',
    remediation: 'Implement GPC detection in your CMP. Configure Usercentrics/OneTrust to auto-apply "Reject All" when GPC is detected.'
  },
  
  'UI Bias': {
    technicalDefinition: 'Consent banner design that makes "Accept" visually prominent (larger, colored, positioned) while "Reject" is de-emphasized (smaller, grey, hidden in settings).',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 7(2)',
        description: 'Consent request must be distinguishable, intelligible, and easily accessible. Biased UI undermines freely given consent.'
      },
      {
        regulation: 'EDPB',
        article: 'Guidelines 05/2020 §3.3.2',
        description: '"Reject All" must be as easy as "Accept All". Hiding rejection requires extra clicks = invalid consent.'
      },
      {
        regulation: 'CCPA',
        article: '§1798.140(l)',
        description: 'Dark patterns that "subvert or impair" consumer choice are prohibited. UI bias is classified as a dark pattern.'
      }
    ],
    dpoRelevance: 'Active EDPB enforcement. Google fined €150M and Facebook €60M (CNIL 2022) for biased consent UIs. Cookie banner lawsuits becoming common.',
    fineRange: '€50,000,000 - €150,000,000 for large companies',
    remediation: 'Ensure "Reject All" button is same size, color prominence, and click-distance as "Accept All". Use EDPB-compliant CMP templates.'
  },
  
  'Pre-Ticked Toggles': {
    technicalDefinition: 'Non-essential consent categories (Analytics, Marketing) are pre-selected/enabled by default in the consent preference center.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 7(4) + Recital 32',
        description: 'Consent must be given by clear affirmative act. Pre-ticked boxes do NOT constitute valid consent (Planet49 CJEU ruling).'
      },
      {
        regulation: 'EDPB',
        article: 'Guidelines 05/2020 §3.1.2',
        description: 'Explicit prohibition on pre-checked boxes for non-essential purposes. Only "Strictly Necessary" may be pre-enabled.'
      }
    ],
    dpoRelevance: 'Established case law. CJEU Planet49 (2019) definitively ruled pre-ticked boxes invalid. Any CMP using them is immediately non-compliant.',
    fineRange: '€10,000 - €5,000,000',
    remediation: 'Configure CMP to have all non-essential toggles OFF by default. Audit Usercentrics/OneTrust/Cookiebot settings.'
  },
  
  'Cross-Border Transfer': {
    technicalDefinition: 'Personal data transmitted to servers located outside the EEA without adequate safeguards (SCCs, DPF, BCRs) or user notification.',
    legalBasis: [
      {
        regulation: 'GDPR',
        article: 'Article 44-49',
        description: 'Transfers to third countries require adequacy decision, appropriate safeguards, or explicit consent for the transfer.'
      },
      {
        regulation: 'EDPB',
        article: 'Recommendations 01/2020',
        description: 'Post-Schrems II, supplementary measures required for US transfers. DPF only covers certified companies.'
      }
    ],
    dpoRelevance: 'High risk area. Meta €1.2B fine (2023) was specifically for US transfers. China-based services (TikTok) face even higher scrutiny.',
    fineRange: '€500,000 - €1,200,000,000',
    remediation: 'Verify all third-party vendors are DPF-certified or have executed SCCs. Consider EU-based alternatives for high-risk processing.'
  },
  
  'Accessibility Violation': {
    technicalDefinition: 'Consent banner fails WCAG 2.2 AA standards: insufficient color contrast (<4.5:1), missing ARIA labels, or not keyboard-navigable.',
    legalBasis: [
      {
        regulation: 'EAA',
        article: 'Directive 2019/882',
        description: 'European Accessibility Act requires digital services to be POUR-compliant (Perceivable, Operable, Understandable, Robust) by June 2025.'
      },
      {
        regulation: 'GDPR',
        article: 'Article 7(2)',
        description: 'Consent must be "easily accessible." Inaccessible banners exclude users with disabilities from exercising their rights.'
      }
    ],
    dpoRelevance: 'Emerging compliance area. EAA enforcement begins June 2025. Sites failing accessibility may face both EAA fines AND GDPR complaints from disability advocacy groups.',
    fineRange: '€10,000 - €500,000 (EAA) + GDPR penalties',
    remediation: 'Audit banner with WAVE or axe-core. Ensure contrast ≥4.5:1, add aria-label to buttons, enable keyboard navigation.'
  }
};

interface LegalTooltipProps {
  violationType: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const LegalTooltip: React.FC<LegalTooltipProps> = ({ 
  violationType, 
  children,
  position = 'top' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Normalize violation type for lookup
  const normalizedType = violationType
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Find matching context (fuzzy match)
  const context = Object.entries(LEGAL_DATABASE).find(([key]) => 
    normalizedType.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(normalizedType.toLowerCase())
  )?.[1];
  
  if (!context) {
    return children ? <>{children}</> : null;
  }
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        className="ml-1.5 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={`Legal information about ${violationType}`}
      >
        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
      </button>
      
      {isOpen && (
        <div 
          className={`absolute ${positionClasses[position]} z-50 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{normalizedType}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Context</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Technical Definition */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Definition</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{context.technicalDefinition}</p>
            </div>
            
            {/* Legal Basis */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-purple-500" />
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Regulatory Violations</h5>
              </div>
              <div className="space-y-2">
                {context.legalBasis.map((basis, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        basis.regulation === 'GDPR' ? 'bg-blue-100 text-blue-700' :
                        basis.regulation === 'CCPA' ? 'bg-green-100 text-green-700' :
                        basis.regulation === 'EAA' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {basis.regulation}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">{basis.article}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{basis.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* DPO Relevance */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Why This Matters</h5>
              <p className="text-[11px] text-amber-800">{context.dpoRelevance}</p>
            </div>
            
            {/* Fine Range */}
            {context.fineRange && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <h5 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Potential Fine Range</h5>
                <p className="text-sm font-bold text-red-800">{context.fineRange}</p>
              </div>
            )}
            
            {/* Remediation */}
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Recommended Fix</h5>
              <p className="text-[11px] text-emerald-800">{context.remediation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Standalone Legal Badge Component
export const LegalBadge: React.FC<{ violationType: string; riskLevel: string }> = ({ 
  violationType, 
  riskLevel 
}) => {
  const riskColors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  
  return (
    <LegalTooltip violationType={violationType}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${riskColors[riskLevel as keyof typeof riskColors] || riskColors.Medium}`}>
        {violationType || 'Unknown'}
      </span>
    </LegalTooltip>
  );
};

export default LegalTooltip;

