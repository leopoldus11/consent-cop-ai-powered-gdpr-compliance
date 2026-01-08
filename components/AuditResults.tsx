import React, { useMemo, useState, useEffect } from 'react';
import { ScanResult, AIAnalysis, RequestLog, AIVerdict } from '../types';
import { ForensicDetailDrawer } from './ForensicDetailDrawer';

interface AuditResultsProps {
  result: ScanResult;
  aiAnalysis: AIAnalysis | null;
  onExportPDF: () => void;
  isExportingPDF: boolean;
}

// Automated AI Verdicts Section Component
const AutomatedVerdicts: React.FC<{ verdicts: AIVerdict[], requests: RequestLog[], onSelectRequest: (req: RequestLog) => void }> = ({ verdicts, requests, onSelectRequest }) => {
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
          const request = requests.find(r => r.id === verdict.requestId);
          const vendor = request ? (request.domain.includes('google') ? 'Google' : request.domain.includes('adobe') ? 'Adobe' : request.domain) : 'Unknown';
          
          const riskStyles = {
            High: { border: 'border-red-500/30', text: 'text-red-500', glow: 'shadow-red-500/10' },
            Medium: { border: 'border-amber-500/30', text: 'text-amber-500', glow: 'shadow-amber-500/10' },
            Low: { border: 'border-blue-500/30', text: 'text-blue-500', glow: 'shadow-blue-500/10' }
          };

          const style = riskStyles[verdict.riskLevel] || riskStyles.Low;

          return (
            <div 
              key={idx} 
              className={`group relative bg-white/40 backdrop-blur-xl border-2 ${style.border} rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${style.glow} cursor-pointer overflow-hidden`}
              onClick={() => request && onSelectRequest(request)}
            >
              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] via-purple-600/[0.03] to-indigo-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Glass Reflection */}
              <div className="absolute -top-[100%] left-[100%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 group-hover:left-[-100%] transition-all duration-1000 ease-in-out"></div>

              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {vendor}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-slate-900 text-[9px] font-black uppercase tracking-widest border border-slate-800 ${style.text}`}>
                    {verdict.riskLevel} Risk
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Violation Type</div>
                  <div className="text-sm font-bold text-slate-800 tracking-tight">{verdict.violationType}</div>
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
                  <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                    Analyze Payload
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
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

// Brand blue color from leopoldblau.com/dev (approximated as professional blue)
const BRAND_BLUE = '#2563eb'; // Tailwind blue-600, professional and accessible

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

  const complianceScore = Math.max(0, Math.min(100, 100 - result.riskScore));
  
  const totalPreConsentRequests = useMemo(() => {
    return result.requests.filter(r => r.consentState === 'pre-consent').length;
  }, [result.requests]);

  const nonCompliantTrackers = result.violationsCount;
  
  const cmpStatus = result.consentBannerDetected ? 'Detected' : 'Not Detected';

  const consentTimestamp = useMemo(() => {
    const sorted = [...result.requests].sort((a, b) => a.timestamp - b.timestamp);
    const firstPostConsent = sorted.find(r => r.consentState === 'post-consent');
    return firstPostConsent?.timestamp || sorted[sorted.length - 1]?.timestamp || 0;
  }, [result.requests]);

  const auditFindings = useMemo(() => {
    if (!aiAnalysis) return { critical: [], warning: [], passed: [] };
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

  return (
    <div className="min-h-screen bg-white text-[#202124] font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Automated AI Verdicts Section */}
        {result.aiVerdicts && result.aiVerdicts.length > 0 && (
          <AutomatedVerdicts verdicts={result.aiVerdicts} requests={result.requests} onSelectRequest={handleRequestClick} />
        )}

        {/* Header: Score and Metrics */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16 border-b border-gray-100 pb-12">
          {/* Circular Compliance Score */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="#F1F3F4"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
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

          {/* Top Row Metrics - Clean & Flat */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col">
              <div className="text-2xl font-normal text-[#202124] tracking-tight tabular-nums">
                {result.requests.length}
              </div>
              <div className="text-xs font-normal text-[#5F6368] uppercase tracking-wide">Total Requests</div>
            </div>
            <div className="flex flex-col">
              <div className={`text-2xl font-normal tracking-tight tabular-nums ${totalPreConsentRequests > 0 ? 'text-[#FF4E42]' : 'text-[#0CCE6B]'}`}>
                {totalPreConsentRequests}
              </div>
              <div className="text-xs font-normal text-[#5F6368] uppercase tracking-wide">Pre-Consent</div>
            </div>
            <div className="flex flex-col">
              <div className={`text-2xl font-normal tracking-tight tabular-nums ${nonCompliantTrackers > 0 ? 'text-[#FF4E42]' : 'text-[#0CCE6B]'}`}>
                {nonCompliantTrackers}
              </div>
              <div className="text-xs font-normal text-[#5F6368] uppercase tracking-wide">Violations</div>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-normal text-[#202124] tracking-tight">
                {cmpStatus}
              </div>
              <div className="text-xs font-normal text-[#5F6368] uppercase tracking-wide">CMP Signal</div>
            </div>
          </div>
        </div>

        {/* Privacy Infrastructure Section - Topology View */}
        <PrivacyInfrastructureMap 
          result={result}
        />

        {/* Data Exfiltration Timeline Section */}
        <DataExfiltrationTimeline 
          requests={result.requests} 
          consentTimestamp={consentTimestamp}
          onSelectRequest={handleRequestClick}
        />

        {/* Audit Results Section - MDB Style */}
        {aiAnalysis && (
          <AuditFindings 
            findings={auditFindings}
            aiAnalysis={aiAnalysis}
            requests={result.requests}
            onSelectRequest={handleRequestClick}
          />
        )}

        {/* Scan Performance Section */}
        {result.performanceMetrics && (
          <div className="mb-20">
            <details className="group border border-gray-100 rounded-lg overflow-hidden transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-[#202124]">Performance Metrics</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gray-400">
                    {( (result.performanceMetrics.totalDuration || 0) / 1000).toFixed(1)}s
                  </span>
                  <svg className="w-4 h-4 text-gray-300 transform group-open:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6 pt-2 border-t border-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  {[
                    { label: 'Browser', value: result.performanceMetrics.browserLaunch },
                    { label: 'Navigation', value: result.performanceMetrics.navigation },
                    { label: 'Banner', value: result.performanceMetrics.bannerDetection },
                    { label: 'Consent', value: result.performanceMetrics.consentInteraction },
                    { label: 'Network', value: result.performanceMetrics.postConsentWait },
                    { label: 'Detectors', value: result.performanceMetrics.detectionAnalysis },
                    { label: 'Gemini', value: result.performanceMetrics.geminiAnalysis },
                    { label: 'Processing', value: result.performanceMetrics.networkProcessing },
                  ].map((metric, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{metric.label}</div>
                      <div className="text-base font-mono font-medium text-[#202124]">
                        {((metric.value || 0) / 1000).toFixed(2)}s
                      </div>
                      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400"
                          style={{ width: `${((metric.value || 0) / (result.performanceMetrics!.totalDuration || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 pb-20">
          <button
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="px-8 py-3 bg-white border border-[#E0E0E0] hover:border-blue-500 text-[#202124] font-medium rounded-full shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {isExportingPDF ? 'Generating PDF...' : 'Export Report'}
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

// Privacy Infrastructure Map Component - Topology View
interface PrivacyInfrastructureMapProps {
  result: ScanResult;
}

const PrivacyInfrastructureMap: React.FC<PrivacyInfrastructureMapProps> = ({ result }) => {
  if (!result.dataLayers.length && !result.tmsDetected.length && !result.bannerProvider) {
    return null;
  }

  return (
    <div className="mb-20">
      <h3 className="text-xl font-normal text-[#202124] mb-12">Privacy Infrastructure</h3>
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 max-w-4xl mx-auto">
        {/* SVG Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#E0E0E0" />
            </marker>
          </defs>
          {/* CMP to TMS */}
          <path d="M 25% 50% L 45% 50%" stroke="#E0E0E0" strokeWidth="1" fill="none" markerEnd="url(#arrowhead)" />
          {/* TMS to Data Engine */}
          <path d="M 55% 50% L 75% 50%" stroke="#E0E0E0" strokeWidth="1" fill="none" markerEnd="url(#arrowhead)" />
        </svg>

        {/* Nodes */}
        {[
          { label: 'CMP', value: result.bannerProvider || 'None', status: result.consentBannerDetected ? 'emerald' : 'gray' },
          { label: 'TMS', value: result.tmsDetected[0] || 'None', status: result.tmsDetected.length > 0 ? 'amber' : 'gray' },
          { label: 'Data Engine', value: result.dataLayers[0] || 'None', status: result.dataLayers.length > 0 ? 'rose' : 'gray' }
        ].map((node, i) => (
          <div key={i} className="relative z-10 w-full md:w-1/3 flex flex-col items-center">
            <div className="px-6 py-3 bg-white border border-[#E0E0E0] rounded-full flex items-center gap-3 shadow-sm hover:border-blue-400 transition-colors">
              <div className={`w-2 h-2 rounded-full ${
                node.status === 'emerald' ? 'bg-[#0CCE6B]' : 
                node.status === 'amber' ? 'bg-[#FFA400]' : 
                node.status === 'rose' ? 'bg-[#FF4E42]' : 'bg-gray-300'
              }`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mb-1">{node.label}</span>
                <span className="text-sm font-medium text-[#202124] leading-none">{node.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Data Exfiltration Timeline Component
interface DataExfiltrationTimelineProps {
  requests: RequestLog[];
  consentTimestamp: number;
  onSelectRequest: (req: RequestLog) => void;
}

const DataExfiltrationTimeline: React.FC<DataExfiltrationTimelineProps> = ({ requests, consentTimestamp, onSelectRequest }) => {
  const [filter, setFilter] = useState<'all' | 'violations' | 'pre-consent'>('all');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFilterChange = (newFilter: 'all' | 'violations' | 'pre-consent') => {
    if (document.startViewTransition) {
      setIsTransitioning(true);
      document.startViewTransition(() => {
        setFilter(newFilter);
        setIsTransitioning(false);
      });
    } else {
      setFilter(newFilter);
    }
  };

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => a.timestamp - b.timestamp);
  }, [requests]);

  const minTime = sortedRequests[0]?.timestamp || 0;

  // Helper function to detect request category and provide explanation
  const categorizeRequest = (req: RequestLog): { category: 'marketing' | 'analytics' | 'social' | 'fingerprinting' | 'other', reason: string } => {
    const urlLower = req.url.toLowerCase();
    const domainLower = req.domain.toLowerCase();
    
    if (/fingerprint|fpjs|fingerprintjs|deviceprint|canvas.*fingerprint/i.test(urlLower) || /client.*hints|high.*entropy|user.*agent.*client.*hints/i.test(urlLower) || req.dataTypes.some(dt => dt.toLowerCase().includes('fingerprint'))) {
      return { category: 'fingerprinting', reason: 'Detected browser trait harvesting (Known Fingerprinter)' };
    }
    
    if (/doubleclick|googleadservices|googlesyndication|pixel|beacon/i.test(urlLower) || /advertising|adserver|adsystem|adtech|adform|adnxs/i.test(urlLower)) {
      return { category: 'marketing', reason: `Matched tracking domain ${req.domain} (Known AdTech)` };
    }
    
    if (/google-analytics|googletagmanager|analytics\.js|gtag|ga\.js|appmeasurement/i.test(urlLower) || /adobe.*analytics|omtrdc|2o7\.net|adobedtm|assets\.adobedtm/i.test(urlLower)) {
      return { category: 'analytics', reason: 'Analytics/TMS platform detected' };
    }
    
    if (/facebook\.com\/tr|facebook\.net|fbcdn|connect\.facebook/i.test(urlLower) || /linkedin.*tracking|linkedin.*analytics/i.test(urlLower) || /twitter.*tracking|t\.co/i.test(urlLower) || /pinterest.*tracking/i.test(urlLower)) {
      return { category: 'social', reason: 'Social media tracking pixel' };
    }
    
    return { category: 'other', reason: 'Unclassified third-party request' };
  };

  // Group requests by vendor
  const vendorGroups = useMemo(() => {
    const groups: Record<string, { requests: RequestLog[], preConsentCount: number, criticalCount: number, category: string }> = {};
    
    sortedRequests.forEach(req => {
      let vendor = req.domain;
      const url = req.url.toLowerCase();
      
      if (url.includes('google')) vendor = 'Google';
      else if (url.includes('adobe') || url.includes('adobedtm')) vendor = 'Adobe';
      else if (url.includes('facebook') || url.includes('fbcdn')) vendor = 'Meta';
      else if (url.includes('tiktok')) vendor = 'TikTok';
      else if (url.includes('linkedin')) vendor = 'LinkedIn';
      else if (url.includes('hotjar')) vendor = 'Hotjar';
      
      if (!groups[vendor]) {
        const { category } = categorizeRequest(req);
        groups[vendor] = { requests: [], preConsentCount: 0, criticalCount: 0, category };
      }
      
      const isPreConsent = req.consentState === 'pre-consent';
      const { category } = categorizeRequest(req);
      const isCritical = isPreConsent && (category === 'marketing' || category === 'analytics' || category === 'social');
      
      groups[vendor].requests.push(req);
      if (isPreConsent) groups[vendor].preConsentCount++;
      if (isCritical) groups[vendor].criticalCount++;
    });
    
    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.preConsentCount - a.preConsentCount);
  }, [sortedRequests]);

  const categorizedRequests = useMemo(() => {
    return sortedRequests.map(req => {
      const isPreConsent = req.consentState === 'pre-consent';
      const isViolation = req.status === 'violation';
      const { category: requestCategory } = categorizeRequest(req);
      if (isPreConsent && (requestCategory === 'marketing' || requestCategory === 'analytics' || requestCategory === 'social')) return { ...req, category: 'critical' as const, requestCategory };
      if (isPreConsent && (requestCategory === 'fingerprinting' || req.dataTypes.some(dt => dt.toLowerCase().includes('fingerprint')))) return { ...req, category: 'warning' as const, requestCategory };
      if (isPreConsent && (isViolation || req.dataTypes.length > 0)) return { ...req, category: 'warning' as const, requestCategory };
      return { ...req, category: 'safe' as const, requestCategory };
    });
  }, [sortedRequests]);

  const filteredRequests = useMemo(() => {
    if (filter === 'violations') return categorizedRequests.filter(r => r.status === 'violation');
    if (filter === 'pre-consent') return categorizedRequests.filter(r => r.consentState === 'pre-consent');
    return categorizedRequests;
  }, [categorizedRequests, filter]);

  return (
    <div id="data-exfiltration-timeline" className="mb-12 bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-4 sm:p-8 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Data Exfiltration Timeline</h3>
          <p className="text-sm text-slate-500 font-medium">Monitoring vendor behavior across the consent signal.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1 w-full lg:w-auto overflow-x-auto">
          {['all', 'violations', 'pre-consent'].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f as any)}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all min-h-[44px] whitespace-nowrap ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? 'All' : f === 'violations' ? 'Violations' : 'Pre-Consent'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Insights - Stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
          <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Exposure Level</div>
          <div className="text-xl font-black text-slate-900">
            {vendorGroups.filter(v => v.preConsentCount > 0).length} Active Vendors
          </div>
          <div className="text-xs text-slate-500 mt-1">Collecting data before consent</div>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
          <div className="text-[10px] font-black text-red-400 uppercase mb-1">Critical Leaks</div>
          <div className="text-xl font-black text-red-600">
            {categorizedRequests.filter(r => r.category === 'critical').length} Marketing Requests
          </div>
          <div className="text-xs text-red-500 mt-1">Sent to trackers before opt-in</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <div className="text-[10px] font-black text-blue-400 uppercase mb-1">Data Weight</div>
          <div className="text-xl font-black text-blue-600">
            {Math.round(categorizedRequests.filter(r => r.consentState === 'pre-consent').length * 0.8)} KB Exfiltrated
          </div>
          <div className="text-xs text-blue-500 mt-1">Estimated payload size (pre-consent)</div>
        </div>
      </div>

          {/* Grouped Vendor Timeline - Vertical List of Rows */}
          <div className={`relative border border-slate-100 rounded-xl overflow-hidden ${isTransitioning ? 'overflow-hidden' : ''}`}>
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Infrastructure Map</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Status</div>
            </div>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar" style={{ contain: 'layout paint' }}>
              {vendorGroups.map((vendor) => (
                <div key={vendor.name} className="border-b border-slate-50 last:border-0">
                  <div className="px-6 py-4 bg-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${vendor.criticalCount > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-emerald-500'}`}></div>
                      <span className="font-black text-slate-900 tracking-tight">{vendor.name}</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">{vendor.category}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {vendor.requests.length} total signals
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-50/30">
                    {vendor.requests.map((req) => {
                      const { category, reason } = categorizeRequest(req);
                      const isPreConsent = req.consentState === 'pre-consent';
                      const isHighRisk = isPreConsent && (category === 'marketing' || category === 'analytics' || category === 'social');
                      
                      return (
                        <button 
                          key={req.id}
                          onClick={() => onSelectRequest(req)}
                          className={`w-full flex items-center justify-between px-8 py-3 hover:bg-slate-50 transition-all group text-left ${isHighRisk ? 'bg-red-50/20' : ''}`}
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isPreConsent ? 'bg-amber-400' : 'bg-emerald-400 opacity-40'}`}></div>
                            <div className="flex flex-col overflow-hidden">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700 truncate">{req.url}</span>
                                {req.discrepancyScore && req.discrepancyScore > 50 && (
                                  <span className="flex-shrink-0 bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">⚠️ Policy Mismatch</span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium truncate">{reason}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                            <div className="flex flex-col items-end">
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${isPreConsent ? 'text-amber-600' : 'text-slate-400'}`}>
                                {isPreConsent ? 'Pre-Consent' : 'Post-Consent'}
                              </span>
                              <span className="text-[9px] font-mono text-slate-300">
                                +{((req.timestamp - minTime) / 1000).toFixed(2)}s
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
    </div>
  );
};

// Audit Findings Component - MDB Style
interface AuditFindingsProps {
  findings: {
    critical: AIAnalysis['remediationSteps'];
    warning: AIAnalysis['remediationSteps'];
    passed: AIAnalysis['remediationSteps'];
  };
  aiAnalysis: AIAnalysis;
  onSelectRequest: (req: RequestLog) => void;
}

const AuditFindings: React.FC<AuditFindingsProps & { requests: RequestLog[] }> = ({ findings, aiAnalysis, requests, onSelectRequest }) => {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const minTime = useMemo(() => {
    if (requests.length === 0) return 0;
    return Math.min(...requests.map(r => r.timestamp));
  }, [requests]);

  const findEvidence = (title: string) => {
    const titleLower = title.toLowerCase();
    return requests.filter(req => {
      const url = req.url.toLowerCase();
      if (titleLower.includes('google') || titleLower.includes('ga4')) return url.includes('google-analytics') || url.includes('googletagmanager');
      if (titleLower.includes('adobe') || titleLower.includes('launch')) return url.includes('adobedtm') || url.includes('assets.adobedtm');
      if (titleLower.includes('meta') || titleLower.includes('facebook')) return url.includes('facebook.com') || url.includes('fbcdn');
      if (titleLower.includes('pixel') || titleLower.includes('tracking')) return req.status === 'violation' && req.consentState === 'pre-consent';
      return req.domain.toLowerCase().includes(titleLower.split(' ')[0]);
    }).slice(0, 5);
  };

  const allFindings = [
    ...findings.critical.map(f => ({ ...f, type: 'critical' })),
    ...findings.warning.map(f => ({ ...f, type: 'warning' })),
    ...findings.passed.map(f => ({ ...f, type: 'passed' }))
  ];

  return (
    <div className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-normal text-[#202124]">Diagnostics</h3>
        <div className="text-xs text-[#5F6368] font-medium uppercase tracking-wider">
          {allFindings.filter(f => f.type !== 'passed').length} Potential Issues
        </div>
      </div>

      <div className="border border-[#E0E0E0] rounded-lg overflow-hidden divide-y divide-[#E0E0E0]">
        {allFindings.map((finding, idx) => {
          const id = `${finding.type}-${idx}`;
          const isExpanded = expandedIndex === id;
          const evidence = findEvidence(finding.title);
          
          return (
            <div key={id} className="bg-white">
              <button 
                onClick={() => setExpandedIndex(isExpanded ? null : id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-4 flex-1">
                  {finding.type === 'critical' ? (
                    <svg className="w-5 h-5 text-[#FF4E42]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L1 21h22L12 2zm0 3.45l8.27 14.3H3.73L12 5.45zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
                    </svg>
                  ) : finding.type === 'warning' ? (
                    <div className="w-5 h-5 bg-[#FFA400] rounded-sm" />
                  ) : (
                    <div className="w-5 h-5 bg-[#0CCE6B] rounded-full" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#202124] leading-tight">{finding.title}</span>
                    <span className="text-xs text-[#5F6368] font-normal mt-0.5">{finding.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-mono text-[#5F6368] tabular-nums hidden sm:block">
                    {evidence.length > 0 ? `${evidence.length} Requests` : ''}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Forensic Evidence</div>
                    <div className="space-y-2 font-mono text-[11px] text-[#202124]">
                      {evidence.length > 0 ? evidence.map((ev, i) => (
                        <button 
                          key={i} 
                          onClick={() => onSelectRequest(ev)}
                          className={`w-full flex justify-between gap-4 py-1.5 border-b border-gray-200/50 last:border-0 overflow-hidden hover:bg-white hover:shadow-sm transition-all text-left ${ev.discrepancyScore && ev.discrepancyScore > 50 ? 'bg-red-50/50' : ''}`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1">
                            <span className="truncate text-blue-600 hover:text-blue-800">{ev.url}</span>
                            {ev.discrepancyScore && ev.discrepancyScore > 50 && (
                              <span className="flex-shrink-0 bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">⚠️ Policy Mismatch</span>
                            )}
                          </div>
                          <span className="text-gray-400 flex-shrink-0">+{((ev.timestamp - minTime) / 1000).toFixed(2)}s</span>
                        </button>
                      )) : (
                        <div className="text-gray-400 italic">No specific network evidence found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {aiAnalysis.summary && (
        <div className="mt-12 p-8 bg-blue-50/50 border border-blue-100 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🤖</span>
            <h4 className="text-base font-bold text-blue-900 tracking-tight">Executive DPO Summary</h4>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed font-medium">{aiAnalysis.summary}</p>
        </div>
      )}
    </div>
  );
};
