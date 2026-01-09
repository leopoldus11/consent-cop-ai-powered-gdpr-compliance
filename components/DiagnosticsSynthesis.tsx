/**
 * DiagnosticsSynthesis.tsx
 * 
 * Unified Audit Context Engine
 * 
 * Aggregates all scan data (EvidenceVault, SymmetryAuditor, GDPRAuditor, VisionAuditor)
 * into a cohesive narrative for DPO-ready reporting.
 * 
 * Transforms fragmented technical data into "Legal Storytelling"
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Shield,
  FileText,
  Scale,
  Eye,
  Fingerprint,
  Globe,
  Clock,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { ScanResult } from '../types';
import { LegalTooltip, LegalBadge } from './LegalTooltip';

interface DiagnosticsSynthesisProps {
  result: ScanResult;
  aiAnalysis?: string;
}

interface Finding {
  category: 'technical' | 'dark_pattern' | 'regulatory' | 'data_flow';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string;
  regulation?: string;
  remediation: string;
}

/**
 * Synthesize all scan data into unified findings
 */
function synthesizeFindings(result: ScanResult): Finding[] {
  const findings: Finding[] = [];

  // 1. TECHNICAL FINDINGS - Pre-consent tracking
  const preConsentViolations = (result.requestsBeforeConsent || []).filter(r => r.status === 'violation');
  if (preConsentViolations.length > 0) {
    findings.push({
      category: 'technical',
      severity: preConsentViolations.length > 10 ? 'critical' : 'high',
      title: 'Pre-Consent Data Collection',
      description: `${preConsentViolations.length} tracking requests were captured BEFORE user consent was obtained. This includes requests to ${[...new Set(preConsentViolations.slice(0, 5).map(r => new URL(r.url).hostname))].join(', ')}.`,
      evidence: `Network log shows ${preConsentViolations.length} requests with timestamps preceding consent click at ${result.consentTimestamp ? new Date(result.consentTimestamp).toISOString() : 'unknown'}.`,
      regulation: 'GDPR Article 7(1), CCPA §1798.100',
      remediation: 'Implement server-side tagging with consent gating. Configure CMP to block non-essential scripts until opt-in.'
    });
  }

  // 2. GPC VIOLATION
  if (result.siteViolations?.includes('GPC_IGNORED')) {
    findings.push({
      category: 'regulatory',
      severity: 'critical',
      title: 'Global Privacy Control Signal Ignored',
      description: 'The browser sent a GPC (Global Privacy Control) opt-out signal, but tracking continued without honoring the preference.',
      evidence: `GPC signal sent: ${result.gpcSignalSent}. Post-signal tracking requests detected: ${preConsentViolations.length}.`,
      regulation: 'CCPA §999.315(h) - Mandatory since January 1, 2026',
      remediation: 'Configure CMP to auto-apply "Reject All" when navigator.globalPrivacyControl === true.'
    });
  }

  // 3. UI SYMMETRY VIOLATION
  if (result.siteViolations?.includes('UI_BIAS_DETECTED') || result.symmetryAudit?.biasDetected) {
    const symmetry = result.symmetryAudit;
    findings.push({
      category: 'dark_pattern',
      severity: 'high',
      title: 'Consent Banner UI Bias',
      description: 'The "Accept" button is visually more prominent than the "Reject" option, violating the principle of equally easy consent and rejection.',
      evidence: symmetry ? 
        `Accept button: ${symmetry.acceptButton?.width}x${symmetry.acceptButton?.height}px. Reject button: ${symmetry.rejectButton?.width || 'not found'}x${symmetry.rejectButton?.height || 'not found'}px. Size ratio: ${symmetry.sizeRatio?.toFixed(2) || 'N/A'}.` :
        'Symmetry analysis detected visual bias in button prominence.',
      regulation: 'EDPB Guidelines 05/2020 §3.3.2',
      remediation: 'Ensure "Reject All" button has identical size, color prominence, and position accessibility as "Accept All".'
    });
  }

  // 4. FIRST-LAYER REJECT MISSING
  const parityResult = result.gdprAudit?.parity;
  if (parityResult && !parityResult.firstLayerRejectVisible) {
    findings.push({
      category: 'dark_pattern',
      severity: 'critical',
      title: 'Missing First-Layer Rejection',
      description: 'No "Reject All" or equivalent button visible on the first layer of the consent banner. Users must navigate to a secondary layer to decline.',
      evidence: parityResult.evidence || 'First-layer scan found no reject button matching standard selectors.',
      regulation: 'EDPB Guidelines 05/2020 - "Parity of Ease"',
      remediation: 'Add a clearly visible "Reject All" or "Decline" button to the initial consent banner layer.'
    });
  }

  // 5. PRE-TICKED TOGGLES
  const granularity = result.gdprAudit?.granularity;
  if (granularity?.preTickedNonEssential) {
    findings.push({
      category: 'dark_pattern',
      severity: 'high',
      title: 'Pre-Ticked Non-Essential Consent',
      description: `${granularity.preTickedCount} non-essential consent categories (Analytics, Marketing) are pre-selected by default.`,
      evidence: `Toggle analysis found pre-ticked categories: ${granularity.toggles?.filter(t => t.isPreTicked && t.category !== 'NECESSARY').map(t => t.label).join(', ') || 'Unknown'}.`,
      regulation: 'GDPR Article 7(4), CJEU Planet49 ruling',
      remediation: 'Configure CMP to have all non-essential toggles OFF by default. Only "Strictly Necessary" may be pre-enabled.'
    });
  }

  // 6. ACCESSIBILITY FAILURES
  const accessibility = result.gdprAudit?.accessibility;
  if (accessibility && !accessibility.wcag22Compliant) {
    findings.push({
      category: 'regulatory',
      severity: 'medium',
      title: 'Consent Banner Accessibility Failure',
      description: 'The consent banner does not meet WCAG 2.2 AA standards, potentially excluding users with disabilities from exercising their privacy rights.',
      evidence: accessibility.violations?.join('; ') || 'Contrast ratio, ARIA labels, or keyboard navigation failed.',
      regulation: 'European Accessibility Act 2019/882, GDPR Article 7(2)',
      remediation: 'Audit banner with WAVE or axe-core. Ensure contrast ≥4.5:1, add aria-label to buttons, enable keyboard navigation.'
    });
  }

  // 7. ARTICLE 13 TRANSPARENCY
  const transparency = result.gdprAudit?.transparency;
  if (transparency && transparency.articleCompliance !== 'FULL') {
    findings.push({
      category: 'regulatory',
      severity: transparency.articleCompliance === 'NONE' ? 'high' : 'medium',
      title: 'Article 13 Transparency Deficiency',
      description: transparency.articleCompliance === 'NONE' ?
        'The consent banner fails to disclose data categories OR specific third-party recipients.' :
        'The consent banner provides only partial transparency. Some disclosures are vague or generic.',
      evidence: transparency.evidence || 'AI vision analysis did not detect explicit data categories or named third parties.',
      regulation: 'GDPR Article 13(1)(e)(f), EDPB 2026 Coordinated Enforcement',
      remediation: 'Update banner to explicitly name data categories (e.g., "browsing behavior, device ID") and specific third parties (e.g., "Google LLC, Meta Platforms Ireland Ltd").'
    });
  }

  // 8. CROSS-BORDER DATA TRANSFERS
  const residencyViolations = result.dataResidencyViolations || [];
  if (residencyViolations.length > 0) {
    const nonAdequateCountries = [...new Set(residencyViolations.map(v => v.country || 'Unknown'))];
    findings.push({
      category: 'data_flow',
      severity: nonAdequateCountries.includes('China') || nonAdequateCountries.includes('Russia') ? 'critical' : 'high',
      title: 'Non-Adequate Country Data Transfer',
      description: `Personal data was sent to ${residencyViolations.length} endpoints in non-adequate countries: ${nonAdequateCountries.join(', ')}.`,
      evidence: `Geo-IP analysis detected transfers to: ${residencyViolations.slice(0, 5).map(v => `${v.requestDomain} (${v.country})`).join(', ')}.`,
      regulation: 'GDPR Articles 44-49, Schrems II ruling',
      remediation: 'Verify all third-party vendors are DPF-certified or have executed SCCs. Consider EU-based alternatives for high-risk processing.'
    });
  }

  // 9. AI VERDICT FINDINGS
  const highRiskVerdicts = (result.aiVerdicts || []).filter(v => v.riskLevel === 'High');
  for (const verdict of highRiskVerdicts.slice(0, 3)) {
    if (verdict.violationType === 'Fingerprinting') {
      findings.push({
        category: 'technical',
        severity: 'critical',
        title: 'Browser Fingerprinting Detected',
        description: verdict.explanation || 'Device fingerprinting scripts were executed before consent.',
        evidence: `AI forensic analysis flagged ${verdict.vendorType} request to ${verdict.targetDomain} as ${verdict.purpose}. TraceID: ${verdict.traceId}`,
        regulation: 'GDPR Article 5(1)(a), CCPA §1798.100(a)',
        remediation: 'Remove fingerprinting scripts or gate them behind explicit consent (TCF Purpose 10).'
      });
    } else if (verdict.violationType === 'PII Leak') {
      findings.push({
        category: 'technical',
        severity: 'critical',
        title: 'PII Leaked Pre-Consent',
        description: verdict.explanation || 'Personally identifiable information was transmitted to third parties before consent.',
        evidence: `AI forensic analysis identified PII in ${verdict.vendorType} request to ${verdict.targetDomain}. TraceID: ${verdict.traceId}`,
        regulation: 'GDPR Article 7(1), CCPA §1798.120',
        remediation: 'Implement server-side tagging with PII scrubbing. Gate all non-essential pixels behind consent.'
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return findings;
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(result: ScanResult, findings: Finding[]): string {
  const score = result.riskScore || 0;
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  
  if (score >= 70) {
    return `CRITICAL COMPLIANCE RISK: This website has ${criticalCount} critical and ${highCount} high-severity compliance issues that require immediate remediation. The combination of pre-consent tracking, UI dark patterns, and regulatory non-compliance creates substantial liability under both GDPR and CCPA 2026 enforcement priorities. Recommend immediate escalation to legal and engineering teams.`;
  } else if (score >= 40) {
    return `ELEVATED RISK: This website shows ${highCount} significant compliance gaps that should be addressed within 30 days. While not critically non-compliant, the identified issues may attract regulatory attention during coordinated enforcement actions. Recommend scheduled remediation during next sprint cycle.`;
  } else {
    return `ACCEPTABLE COMPLIANCE POSTURE: This website demonstrates reasonable privacy practices with ${findings.length} minor optimization opportunities. Current implementation aligns with EDPB guidance, though continuous monitoring is recommended as regulatory standards evolve.`;
  }
}

export const DiagnosticsSynthesis: React.FC<DiagnosticsSynthesisProps> = ({ result, aiAnalysis }) => {
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  
  const findings = useMemo(() => synthesizeFindings(result), [result]);
  const executiveSummary = useMemo(() => generateExecutiveSummary(result, findings), [result, findings]);
  
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;

  const categoryIcons = {
    technical: Fingerprint,
    dark_pattern: Eye,
    regulatory: Scale,
    data_flow: Globe
  };

  const severityStyles = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' },
    high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500' },
    low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-400' }
  };

  return (
    <div className="mb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Unified Audit Synthesis</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">AI-Aggregated Legal Narrative</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-indigo-400" />
          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Executive Summary</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{executiveSummary}</p>
        
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-bold text-slate-400">{criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs font-bold text-slate-400">{highCount} High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs font-bold text-slate-400">{mediumCount} Medium</span>
          </div>
        </div>
      </motion.div>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.map((finding, index) => {
          const Icon = categoryIcons[finding.category];
          const styles = severityStyles[finding.severity];
          const isExpanded = expandedFinding === index;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${styles.bg} ${styles.border} border rounded-2xl overflow-hidden`}
            >
              <button
                onClick={() => setExpandedFinding(isExpanded ? null : index)}
                className="w-full p-5 flex items-start gap-4 text-left"
              >
                <div className={`w-10 h-10 ${styles.badge} bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${styles.text}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 ${styles.badge} text-white text-[9px] font-black uppercase rounded`}>
                      {finding.severity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {finding.category.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold ${styles.text}`}>{finding.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{finding.description}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 border-t border-slate-200/50"
                >
                  <div className="pt-4 space-y-4">
                    {/* Evidence */}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Evidence</div>
                      <div className="p-3 bg-white/50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-700 font-mono">{finding.evidence}</p>
                      </div>
                    </div>
                    
                    {/* Regulation */}
                    {finding.regulation && (
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Applicable Regulation</div>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold text-purple-700">{finding.regulation}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Remediation */}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recommended Fix</div>
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-xs text-emerald-800">{finding.remediation}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* No Findings */}
      {findings.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Significant Findings</h3>
          <p className="text-sm text-slate-500">This website demonstrates strong privacy compliance practices.</p>
        </div>
      )}

      {/* AI Analysis Integration */}
      {aiAnalysis && (
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">AI Deep Analysis</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsSynthesis;

