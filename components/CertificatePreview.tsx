
import React from 'react';
import { Shield, CheckCircle, AlertTriangle, Clock, Globe, Scale, FileWarning, Eye, Fingerprint, MapPin, Info } from 'lucide-react';
import { ScanResult } from '../types';

interface CertificatePreviewProps {
  result: ScanResult;
  onDownloadJSON: () => void;
  onDownloadPDF: () => void;
}

/**
 * Analyze scan result to categorize violations
 */
function analyzeViolations(result: ScanResult): {
  technicalLeaks: string[];
  darkPatterns: string[];
  regulatoryNonCompliance: string[];
  jurisdiction: ('GDPR' | 'CCPA' | 'EAA')[];
} {
  const technicalLeaks: string[] = [];
  const darkPatterns: string[] = [];
  const regulatoryNonCompliance: string[] = [];
  const jurisdiction: ('GDPR' | 'CCPA' | 'EAA')[] = [];

  // Analyze site violations
  const violations = result.siteViolations || [];
  
  if (violations.includes('GPC_IGNORED')) {
    regulatoryNonCompliance.push('GPC Signal Ignored (CCPA §999.315(h))');
    if (!jurisdiction.includes('CCPA')) jurisdiction.push('CCPA');
  }
  
  if (violations.includes('UI_BIAS_DETECTED')) {
    darkPatterns.push('Asymmetric Button Prominence (EDPB 05/2020)');
    if (!jurisdiction.includes('GDPR')) jurisdiction.push('GDPR');
  }
  
  if (violations.includes('GDPR_PARITY_VIOLATION')) {
    darkPatterns.push('Missing First-Layer Reject Button');
    if (!jurisdiction.includes('GDPR')) jurisdiction.push('GDPR');
  }

  // Analyze pre-consent tracking
  const preConsentRequests = (result.requestsBeforeConsent || []).filter(r => r.status === 'violation');
  if (preConsentRequests.length > 0) {
    technicalLeaks.push(`${preConsentRequests.length} Pre-Consent Tracking Requests`);
    if (!jurisdiction.includes('GDPR')) jurisdiction.push('GDPR');
  }

  // Analyze AI verdicts
  const aiVerdicts = result.aiVerdicts || [];
  const highRiskVerdicts = aiVerdicts.filter(v => v.riskLevel === 'High');
  
  for (const verdict of highRiskVerdicts) {
    if (verdict.violationType === 'Fingerprinting') {
      technicalLeaks.push('Browser Fingerprinting Detected');
    } else if (verdict.violationType === 'PII Leak') {
      technicalLeaks.push('PII Leaked Pre-Consent');
    } else if (verdict.violationType === 'Granular Tracking') {
      technicalLeaks.push('Granular Behavior Tracking');
    }
  }

  // Analyze GDPR audit results
  const gdprAudit = result.gdprAudit;
  if (gdprAudit) {
    if (gdprAudit.parity && !gdprAudit.parity.firstLayerRejectVisible) {
      darkPatterns.push('Reject Requires Extra Clicks');
    }
    if (gdprAudit.granularity?.preTickedNonEssential) {
      darkPatterns.push(`${gdprAudit.granularity.preTickedCount} Pre-Ticked Non-Essential Toggles`);
    }
    if (gdprAudit.accessibility && !gdprAudit.accessibility.wcag22Compliant) {
      regulatoryNonCompliance.push('WCAG 2.2 Accessibility Failure');
      if (!jurisdiction.includes('EAA')) jurisdiction.push('EAA');
    }
    if (gdprAudit.transparency?.articleCompliance !== 'FULL') {
      regulatoryNonCompliance.push('Article 13 Transparency Deficient');
    }
  }

  // Analyze data residency
  const residencyViolations = result.dataResidencyViolations || [];
  if (residencyViolations.length > 0) {
    regulatoryNonCompliance.push(`${residencyViolations.length} Non-Adequate Country Transfers`);
    if (!jurisdiction.includes('GDPR')) jurisdiction.push('GDPR');
  }

  // Default jurisdiction if none detected
  if (jurisdiction.length === 0) {
    jurisdiction.push('GDPR');
  }

  return { technicalLeaks, darkPatterns, regulatoryNonCompliance, jurisdiction };
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ 
  result, 
  onDownloadJSON, 
  onDownloadPDF 
}) => {
  if (!result) return null;

  const score = result.riskScore || 0;
  const analysis = analyzeViolations(result);
  
  const riskLevel = score >= 70 ? 'CRITICAL' : score >= 40 ? 'ELEVATED' : 'ACCEPTABLE';
  const riskColor = score >= 70 ? 'text-red-500' : score >= 40 ? 'text-amber-500' : 'text-emerald-500';
  const riskBg = score >= 70 ? 'bg-red-500/10' : score >= 40 ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const riskBorder = score >= 70 ? 'border-red-500/20' : score >= 40 ? 'border-amber-500/20' : 'border-emerald-500/20';

  const certId = result.id ? `CS-${result.id.substring(0, 8).toUpperCase()}-2026` : 'CS-PENDING-2026';
  const displayUrl = result.url || 'Unknown Domain';
  const scanDate = result.timestamp ? new Date(result.timestamp).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'N/A';

  const totalViolations = 
    analysis.technicalLeaks.length + 
    analysis.darkPatterns.length + 
    analysis.regulatoryNonCompliance.length;

  return (
    <div className="mb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Compliance Audit Certificate</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Forensic Attestation • Evidence of Due Diligence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Certificate Card */}
        <div className="xl:col-span-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] shadow-2xl"></div>
            
            <div className="relative z-10 p-8 lg:p-10 border border-slate-800 rounded-[2rem]">
              {/* Certificate Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {analysis.jurisdiction.map(j => (
                      <span key={j} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        j === 'GDPR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        j === 'CCPA' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {j}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
                    Privacy Compliance Attestation
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Automated forensic analysis of digital consent practices</p>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Certificate ID</div>
                  <div className="text-xs font-mono text-slate-300 bg-slate-800/50 px-2 py-1 rounded">{certId}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Generated</div>
                  <div className="text-xs text-slate-400">{scanDate}</div>
                </div>
              </div>

              {/* Subject & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Subject</span>
                  </div>
                  <div className="text-lg font-bold text-white truncate">{displayUrl}</div>
                </div>
                
                <div className={`p-5 ${riskBg} border ${riskBorder} rounded-2xl`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`w-4 h-4 ${riskColor}`} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</span>
                  </div>
                  <div className={`text-2xl font-black ${riskColor} tracking-tighter`}>
                    {riskLevel} ({score}/100)
                  </div>
                </div>
              </div>

              {/* WHY Section - Violation Breakdown */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileWarning className="w-4 h-4 text-amber-500" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Why This Score?</h4>
                  <span className="ml-auto text-xs text-slate-500">{totalViolations} Issues Detected</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Technical Leaks */}
                  <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Fingerprint className="w-3 h-3 text-red-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Technical Leaks</span>
                    </div>
                    {analysis.technicalLeaks.length > 0 ? (
                      <ul className="space-y-1">
                        {analysis.technicalLeaks.map((leak, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                            {leak}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No technical leaks detected</p>
                    )}
                  </div>

                  {/* Dark Patterns */}
                  <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Eye className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Dark Patterns</span>
                    </div>
                    {analysis.darkPatterns.length > 0 ? (
                      <ul className="space-y-1">
                        {analysis.darkPatterns.map((pattern, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No dark patterns detected</p>
                    )}
                  </div>

                  {/* Regulatory Non-Compliance */}
                  <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Scale className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Regulatory</span>
                    </div>
                    {analysis.regulatoryNonCompliance.length > 0 ? (
                      <ul className="space-y-1">
                        {analysis.regulatoryNonCompliance.map((violation, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                            {violation}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No regulatory violations</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${totalViolations === 0 ? 'bg-emerald-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
                    {totalViolations === 0 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-widest">
                      {totalViolations === 0 ? 'Compliant' : 'Action Required'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {totalViolations === 0 ? 'No critical violations found' : `${totalViolations} issues need remediation`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onDownloadJSON} 
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-700 transition-colors"
                  >
                    JSON Evidence
                  </button>
                  <button 
                    onClick={onDownloadPDF} 
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg transition-colors"
                  >
                    PDF Attestation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Legal Utility & Chain of Custody */}
        <div className="xl:col-span-4 space-y-6">
          {/* Legal Utility Card */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Certificate Utility</h4>
            </div>
            <div className="space-y-4 text-sm">
              <p className="text-slate-700 leading-relaxed">
                This certificate serves as <strong className="text-blue-700">Evidence of Due Diligence</strong> for:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>CPPA Notice to Cure:</strong> Demonstrates proactive compliance monitoring under CCPA 2026 enforcement</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>EDPB Audit Response:</strong> Provides timestamped evidence for DPA transparency inquiries</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Board Reporting:</strong> DPO-ready summary for executive privacy briefings</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Non-Repudiation Evidence:</strong> SHA-256 hashes of screenshots provide cryptographic proof of what the user saw at the exact millisecond of capture. This evidence is admissible in regulatory proceedings as it cannot be altered without detection.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Chain of Custody */}
          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-500" />
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Evidence Chain</h4>
            </div>
            <div className="space-y-4">
              <div className="relative pl-6 pb-4 border-l-2 border-blue-100">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="text-[10px] font-black text-blue-600 uppercase">Scan Initiated</div>
                <div className="text-xs text-slate-600">{scanDate || 'Timestamp pending'}</div>
              </div>
              
              <div className="relative pl-6 pb-4 border-l-2 border-slate-100">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></div>
                <div className="text-[10px] font-black text-slate-500 uppercase">Screenshots Captured</div>
                <div className="text-xs text-slate-600">
                  {(result.screenshots?.length || 0)} forensic captures
                </div>
              </div>
              
              <div className="relative pl-6 pb-4 border-l-2 border-slate-100">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></div>
                <div className="text-[10px] font-black text-slate-500 uppercase">Requests Analyzed</div>
                <div className="text-xs text-slate-600">
                  {(result.requestsBeforeConsent?.length || 0) + (result.requestsAfterConsent?.length || 0)} network events
                </div>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                <div className="text-[10px] font-black text-emerald-600 uppercase">Certificate Issued</div>
                <div className="text-xs text-slate-600">SHA-256 verified • Immutable</div>
              </div>
            </div>
          </div>

          {/* Jurisdiction Note */}
          <div className="p-4 bg-slate-900 rounded-2xl">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Jurisdiction Scope</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This audit evaluates compliance under {analysis.jurisdiction.join(', ')} 
                  {analysis.jurisdiction.includes('GDPR') && ' (EU General Data Protection Regulation)'}
                  {analysis.jurisdiction.includes('CCPA') && ', CPRA 2023 amendments'}
                  {analysis.jurisdiction.includes('EAA') && ', European Accessibility Act 2025'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
