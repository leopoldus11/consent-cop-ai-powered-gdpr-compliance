
import React, { useMemo, useState, useEffect } from 'react';
import { ScanResult, AIAnalysis, RequestLog, AIVerdict } from '../types';
import { ForensicDetailDrawer } from './ForensicDetailDrawer';
import { CertificatePreview } from './CertificatePreview';
import { AccessibilityDashboard } from './AccessibilityDashboard';
import { TransparencyAuditDisplay } from './TransparencyAuditDisplay';
import { DiagnosticsSynthesis } from './DiagnosticsSynthesis';
import { LegalBadge } from './LegalTooltip';
import { downloadJSON, exportAttestationPDF } from '../services/exportUtils';
import { DEBUG_MODE } from '../services/debugLogger';

// Automated AI Verdicts Section Component
const AutomatedVerdicts: React.FC<{ verdicts: AIVerdict[], requests: RequestLog[], onSelectRequest: (req: RequestLog) => void }> = ({ verdicts, requests, onSelectRequest }) => {
  if (!verdicts || !Array.isArray(verdicts)) return null;
  
  return (
    <div className="mb-20">
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Automated AI Verdicts</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Deep Protocol Forensic Intelligence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {verdicts.map((verdict, idx) => {
          const request = requests?.find(r => r.id === verdict.requestId);
          const domain = request?.domain || 'Unknown Domain';
          const vendor = domain.includes('google') ? 'Google' : domain.includes('adobe') ? 'Adobe' : domain;
          
          const riskStyles = {
            High: { border: 'border-red-500/30', text: 'text-red-500', glow: 'shadow-red-500/10' },
            Medium: { border: 'border-amber-500/30', text: 'text-amber-500', glow: 'shadow-amber-500/10' },
            Low: { border: 'border-blue-500/30', text: 'text-blue-500', glow: 'shadow-blue-500/10' }
          };

          const style = riskStyles[verdict.riskLevel as keyof typeof riskStyles] || riskStyles.Low;

          return (
            <div 
              key={idx} 
              className={`group relative bg-white border-2 ${style.border} rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${style.glow} cursor-pointer overflow-hidden`}
              onClick={() => request && onSelectRequest(request)}
            >
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono">
                      {vendor}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-slate-900 text-[9px] font-black uppercase tracking-widest border border-slate-800 ${style.text}`}>
                    {verdict.riskLevel} Risk
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Violation Type</div>
                  <div className="text-sm font-bold text-slate-800 tracking-tight">
                    <LegalBadge violationType={verdict.violationType || 'None'} riskLevel={verdict.riskLevel} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Forensic Reason</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {verdict.explanation}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Audited</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                    Analyze Payload
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AuditResultsProps {
  result: ScanResult;
  aiAnalysis: AIAnalysis | null;
  onExportPDF: () => void;
  isExportingPDF: boolean;
}

export const AuditResults: React.FC<AuditResultsProps> = ({ 
  result, 
  aiAnalysis, 
  onExportPDF, 
  isExportingPDF 
}) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRequestClick = (req: RequestLog) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
  };

  const complianceScore = Math.max(0, Math.min(100, 100 - (result.riskScore || 0)));
  
  const totalPreConsentRequests = useMemo(() => {
    if (!result.requests || !Array.isArray(result.requests)) return 0;
    return result.requests.filter(r => r.consentState === 'pre-consent').length;
  }, [result.requests]);

  const nonCompliantTrackers = result.violationsCount || 0;
  const cmpStatus = result.consentBannerDetected ? 'Detected' : 'Not Detected';

  const consentTimestamp = useMemo(() => {
    if (!result.requests || result.requests.length === 0) return 0;
    const sorted = [...result.requests].sort((a, b) => a.timestamp - b.timestamp);
    const firstPostConsent = sorted.find(r => r.consentState === 'post-consent');
    return firstPostConsent?.timestamp || sorted[sorted.length - 1]?.timestamp || 0;
  }, [result.requests]);

  const auditFindings = useMemo(() => {
    if (!aiAnalysis || !Array.isArray(aiAnalysis.remediationSteps)) {
      return { critical: [], warning: [], passed: [] };
    }
    const critical = aiAnalysis.remediationSteps.filter(s => s.priority === 'Immediate');
    const warning = aiAnalysis.remediationSteps.filter(s => s.priority === 'Next');
    const passed = aiAnalysis.remediationSteps.filter(s => s.priority === 'Soon');
    return { critical, warning, passed };
  }, [aiAnalysis]);

  const getScoreInfo = (score: number) => {
    if (score >= 90) return { color: '#0CCE6B', text: 'text-[#0CCE6B]', bg: 'bg-[#0CCE6B]/10' };
    if (score >= 50) return { color: '#FFA400', text: 'text-[#FFA400]', bg: 'bg-[#FFA400]/10' };
    return { color: '#FF4E42', text: 'text-[#FF4E42]', bg: 'bg-[#FF4E42]/10' };
  };

  const scoreInfo = getScoreInfo(complianceScore);

  const handleDownloadJSON = () => {
    if (result.certificate) {
      downloadJSON(result.certificate, `Consentinel_Evidence_${result.id.substring(0, 8)}.json`);
    } else {
      alert('Certificate not available.');
    }
  };

  const handleDownloadAttestation = async () => {
    if (result.certificate) {
      await exportAttestationPDF(result, result.certificate);
    } else {
      alert('Attestation not available.');
    }
  };

  // DEBUG_MODE: Log comprehensive audit data to browser console
  useEffect(() => {
    if (result && DEBUG_MODE.enabled) {
      console.clear();
      console.log('%c════════════════════════════════════════════════', 'color: #10b981; font-weight: bold;');
      console.log('%c   CONSENTINEL FORENSIC DEBUG OUTPUT', 'color: #10b981; font-weight: bold; font-size: 18px;');
      console.log('%c════════════════════════════════════════════════', 'color: #10b981; font-weight: bold;');
      
      // Overall scan summary
      DEBUG_MODE.logScanSummary(result);
      
      // AI Verdicts (violations)
      if (result.aiVerdicts && result.aiVerdicts.length > 0) {
        DEBUG_MODE.logViolations(result.aiVerdicts);
      }
      
      // GDPR 2026 Audit results
      if (result.gdprAudit) {
        DEBUG_MODE.logGDPRAudit(result.gdprAudit);
      }
      
      // Accessibility scores (POUR)
      if (result.gdprAudit?.accessibility?.pourScores) {
        DEBUG_MODE.logAccessibility(result.gdprAudit.accessibility.pourScores);
      }
      
      // Article 13 Transparency
      if (result.gdprAudit?.transparency) {
        DEBUG_MODE.logTransparency(result.gdprAudit.transparency);
      }
      
      console.log('%c════════════════════════════════════════════════', 'color: #10b981; font-weight: bold;');
      console.log('%cTo disable debug mode, run: CONSENTINEL_DEBUG.disable()', 'color: #888; font-style: italic;');
    }
  }, [result]);

  if (!result) return null;

  return (
    <div className="w-full bg-white text-[#202124] font-sans pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* AI Verdicts */}
        {result.aiVerdicts && result.aiVerdicts.length > 0 && (
          <AutomatedVerdicts verdicts={result.aiVerdicts} requests={result.requests} onSelectRequest={handleRequestClick} />
        )}

        {/* Header: Score and Metrics */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16 border-b border-gray-100 pb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="#F1F3F4" strokeWidth="8" fill="none" />
                <circle
                  cx="64" cy="64" r="58"
                  stroke={scoreInfo.color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={`${2 * Math.PI * 58 * (1 - complianceScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-normal ${scoreInfo.text}`}>
                  {Math.round(complianceScore)}
                </span>
              </div>
            </div>
            <div className="text-sm font-medium uppercase tracking-wider text-gray-500">Compliance</div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col">
              <div className="text-2xl font-normal text-[#202124]">{result.requests?.length || 0}</div>
              <div className="text-xs text-[#5F6368] uppercase">Total Requests</div>
            </div>
            <div className="flex flex-col">
              <div className={`text-2xl font-normal ${totalPreConsentRequests > 0 ? 'text-[#FF4E42]' : 'text-[#0CCE6B]'}`}>
                {totalPreConsentRequests}
              </div>
              <div className="text-xs text-[#5F6368] uppercase">Pre-Consent</div>
            </div>
            <div className="flex flex-col">
              <div className={`text-2xl font-normal ${nonCompliantTrackers > 0 ? 'text-[#FF4E42]' : 'text-[#0CCE6B]'}`}>
                {nonCompliantTrackers}
              </div>
              <div className="text-xs text-[#5F6368] uppercase">Violations</div>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-normal text-[#202124]">{cmpStatus}</div>
              <div className="text-xs text-[#5F6368] uppercase">CMP Signal</div>
            </div>
          </div>
        </div>

        <CertificatePreview 
          result={result} 
          onDownloadJSON={handleDownloadJSON}
          onDownloadPDF={handleDownloadAttestation}
        />

        <TransparencyAuditDisplay transparency={result.gdprAudit?.transparency} />
        <AccessibilityDashboard accessibility={result.gdprAudit?.accessibility} />

        <PrivacyInfrastructureMap result={result} />

        <DataExfiltrationTimeline 
          requests={result.requests || []} 
          consentTimestamp={consentTimestamp}
          onSelectRequest={handleRequestClick}
        />

        {/* Unified Diagnostics Synthesis - replaces fragmented AuditFindings */}
        <DiagnosticsSynthesis 
          result={result} 
          aiAnalysis={aiAnalysis?.summary}
        />

        {aiAnalysis && (
          <AuditFindings 
            findings={auditFindings}
            aiAnalysis={aiAnalysis}
            requests={result.requests || []}
            onSelectRequest={handleRequestClick}
          />
        )}

        {/* Action Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDownloadAttestation}
            disabled={isExportingPDF}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest"
          >
            {isExportingPDF ? 'Generating...' : 'Export Forensic Attestation'}
          </button>
          <button
            onClick={onExportPDF}
            className="px-8 py-3 bg-white border border-[#E0E0E0] rounded-xl font-black text-sm uppercase tracking-widest"
          >
            Standard Report
          </button>
        </div>

        <ForensicDetailDrawer 
          request={selectedRequest}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      </div>
    </div>
  );
};

const PrivacyInfrastructureMap: React.FC<{ result: ScanResult }> = ({ result }) => {
  const dataLayers = Array.isArray(result.dataLayers) ? result.dataLayers : [];
  const tmsDetected = Array.isArray(result.tmsDetected) ? result.tmsDetected : [];
  
  if (dataLayers.length === 0 && tmsDetected.length === 0 && !result.bannerProvider) return null;

  return (
    <div className="mb-20">
      <h3 className="text-xl font-normal text-[#202124] mb-12">Privacy Infrastructure</h3>
      <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-4xl mx-auto">
        {[
          { label: 'CMP', value: result.bannerProvider || 'None', status: result.consentBannerDetected ? 'emerald' : 'gray' },
          { label: 'TMS', value: tmsDetected[0] || 'None', status: tmsDetected.length > 0 ? 'amber' : 'gray' },
          { label: 'Data Engine', value: dataLayers[0] || 'None', status: dataLayers.length > 0 ? 'rose' : 'gray' }
        ].map((node, i) => (
          <div key={i} className="px-6 py-3 bg-white border border-[#E0E0E0] rounded-full flex items-center gap-3 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${node.status === 'emerald' ? 'bg-[#0CCE6B]' : node.status === 'amber' ? 'bg-[#FFA400]' : node.status === 'rose' ? 'bg-[#FF4E42]' : 'bg-gray-300'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase">{node.label}</span>
              <span className="text-sm font-medium">{node.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DataExfiltrationTimeline: React.FC<DataExfiltrationTimelineProps> = ({ requests, consentTimestamp, onSelectRequest }) => {
  const [filter, setFilter] = useState<'all' | 'violations' | 'pre-consent'>('all');
  
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => a.timestamp - b.timestamp);
  }, [requests]);

  const minTime = sortedRequests[0]?.timestamp || 0;

  const vendorGroups = useMemo(() => {
    const groups: Record<string, { requests: RequestLog[], preConsentCount: number, criticalCount: number, category: string }> = {};
    sortedRequests.forEach(req => {
      let vendor = req.domain;
      if (!groups[vendor]) groups[vendor] = { requests: [], preConsentCount: 0, criticalCount: 0, category: 'other' };
      groups[vendor].requests.push(req);
      if (req.consentState === 'pre-consent') groups[vendor].preConsentCount++;
    });
    return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [sortedRequests]);

  return (
    <div className="mb-12 bg-white border border-slate-100 rounded-lg p-8 shadow-lg">
      <h3 className="text-xl font-black mb-8">Data Exfiltration Timeline</h3>
      <div className="space-y-4">
        {vendorGroups.slice(0, 10).map(vendor => (
          <div key={vendor.name} className="p-4 border border-slate-50 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">{vendor.name}</span>
              <span className="text-xs text-slate-400">{vendor.requests.length} signals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vendor.requests.slice(0, 5).map(req => (
                <button key={req.id} onClick={() => onSelectRequest(req)} className="px-2 py-1 bg-slate-50 text-[10px] rounded hover:bg-blue-50 transition-colors">
                  {req.consentState === 'pre-consent' ? '🔴 PRE' : '🟢 POST'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuditFindings: React.FC<AuditFindingsProps & { requests: RequestLog[] }> = ({ findings, aiAnalysis, requests, onSelectRequest }) => {
  const allFindings = [
    ...findings.critical.map(f => ({ ...f, type: 'critical' })),
    ...findings.warning.map(f => ({ ...f, type: 'warning' })),
    ...findings.passed.map(f => ({ ...f, type: 'passed' }))
  ];

  return (
    <div className="mb-20">
      <h3 className="text-xl font-normal mb-8">Diagnostics</h3>
      <div className="border border-[#E0E0E0] rounded-lg divide-y divide-[#E0E0E0]">
        {allFindings.map((finding, idx) => (
          <div key={idx} className="p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${finding.type === 'critical' ? 'bg-red-500' : finding.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <div className="text-sm font-bold">{finding.title}</div>
                <div className="text-xs text-gray-500">{finding.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DataExfiltrationTimelineProps {
  requests: RequestLog[];
  consentTimestamp: number;
  onSelectRequest: (req: RequestLog) => void;
}

interface AuditFindingsProps {
  findings: {
    critical: AIAnalysis['remediationSteps'];
    warning: AIAnalysis['remediationSteps'];
    passed: AIAnalysis['remediationSteps'];
  };
  aiAnalysis: AIAnalysis;
}
