import React, { useMemo, useState, useEffect } from 'react';
import { ScanResult, AIAnalysis, RequestLog } from '../types';

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
  // Calculate compliance score (0-100) from riskScore
  // riskScore is typically 0-100 where higher = worse, so we invert it
  const complianceScore = Math.max(0, Math.min(100, 100 - result.riskScore));
  
  // Calculate summary metrics using consentState
  const totalPreConsentRequests = useMemo(() => {
    return result.requests.filter(r => r.consentState === 'pre-consent').length;
  }, [result.requests]);

  const nonCompliantTrackers = result.violationsCount;
  
  // CMP Response Code - derive from bannerProvider or consent detection
  const cmpResponseCode = result.consentBannerDetected ? '200' : '404';
  const cmpStatus = result.consentBannerDetected ? 'Detected' : 'Not Detected';

  // Find consent event timestamp from first post-consent request
  const consentTimestamp = useMemo(() => {
    const sorted = [...result.requests].sort((a, b) => a.timestamp - b.timestamp);
    const firstPostConsent = sorted.find(r => r.consentState === 'post-consent');
    return firstPostConsent?.timestamp || sorted[sorted.length - 1]?.timestamp || 0;
  }, [result.requests]);

  // Group AI analysis by severity for Audit Findings
  const auditFindings = useMemo(() => {
    if (!aiAnalysis) return { critical: [], warning: [], passed: [] };
    
    const critical = aiAnalysis.remediationSteps.filter(s => s.priority === 'Immediate');
    const warning = aiAnalysis.remediationSteps.filter(s => s.priority === 'Next');
    const passed = aiAnalysis.remediationSteps.filter(s => s.priority === 'Soon');
    
    return { critical, warning, passed };
  }, [aiAnalysis]);

  // Get score color based on compliance score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-200' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200' };
    return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200' };
  };

  const scoreColors = getScoreColor(complianceScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Hero Scorecard Section - Bento Layout */}
        <div className="mb-12">
          {/* Bento Grid: 2x2 for score, 1x1 for metrics - Responsive collapse to single column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Circular Compliance Score - 2x2 (spans 2 columns on desktop, full width on mobile) */}
            <div className="md:col-span-2 md:row-span-2 min-h-[300px] md:min-h-[400px]">
              <div className={`h-full bg-gradient-to-br ${
                complianceScore >= 80 
                  ? 'from-emerald-50/80 to-green-50/80' 
                  : complianceScore >= 50
                  ? 'from-amber-50/80 to-orange-50/80'
                  : 'from-red-50/80 to-rose-50/80'
              } backdrop-blur-md border border-slate-200/15 rounded-lg p-8 shadow-lg flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden`}>
                {/* Inner glow for failed audits */}
                {complianceScore < 50 && (
                  <div className="absolute inset-0 bg-red-500/10 blur-3xl"></div>
                )}
                {/* Soft blue gradient for compliant sections */}
                {complianceScore >= 80 && (
                  <div className="absolute inset-0 bg-blue-500/5 blur-3xl"></div>
                )}
                <div className="relative z-10 w-48 h-48 mb-6">
                  <svg className="transform -rotate-90 w-full h-full">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      className="text-slate-100"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - complianceScore / 100)}`}
                      strokeLinecap="round"
                      className={`${scoreColors.bg} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black ${scoreColors.text}`}>
                      {Math.round(complianceScore)}
                    </span>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">
                      Score
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 text-center relative z-10">
                  Compliance Score
                </h3>
              </div>
            </div>

            {/* Total Pre-Consent Requests - 1x1 */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{totalPreConsentRequests}</div>
              <div className="text-sm font-medium text-slate-600">Total Pre-Consent Requests</div>
            </div>

            {/* Non-Compliant Trackers - 1x1 */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-6 shadow-lg relative overflow-hidden">
              {/* Inner glow for failed audits */}
              {nonCompliantTrackers > 0 && (
                <div className="absolute inset-0 bg-red-500/10 blur-2xl"></div>
              )}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1 relative z-10">{nonCompliantTrackers}</div>
              <div className="text-sm font-medium text-slate-600 relative z-10">Non-Compliant Trackers</div>
            </div>

            {/* CMP Response Code - 1x1 */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-6 shadow-lg relative overflow-hidden">
              {/* Soft blue gradient for compliant sections */}
              <div className="absolute inset-0 bg-blue-500/5 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1 relative z-10">{cmpResponseCode}</div>
              <div className="text-sm font-medium text-slate-600 relative z-10">CMP Response: {cmpStatus}</div>
            </div>
          </div>
        </div>

        {/* Data Layer & Badges Section - Top Fold */}
        <DataLayerBadges 
          result={result}
        />

        {/* Lifecycle Waterfall Section */}
        <LifecycleWaterfall 
          requests={result.requests} 
          consentTimestamp={consentTimestamp}
        />

        {/* Audit Results Section - MDB Style */}
        {aiAnalysis && (
          <AuditFindings 
            findings={auditFindings}
            aiAnalysis={aiAnalysis}
          />
        )}

        {/* Action Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-white/80 backdrop-blur-md border border-slate-200/15 px-4 py-2 rounded-lg text-sm font-bold text-slate-700">
              CMP: {result.bannerProvider || 'UNKNOWN'}
            </span>
            <span className="bg-white/80 backdrop-blur-md border border-slate-200/15 px-4 py-2 rounded-lg text-sm font-bold text-slate-700">
              TMS: {result.tmsDetected[0] || 'NONE'}
            </span>
          </div>
          <button
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="min-h-[44px] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExportingPDF ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Layer & Badges Component
interface DataLayerBadgesProps {
  result: ScanResult;
}

const DataLayerBadges: React.FC<DataLayerBadgesProps> = ({ result }) => {
  // Only render if we have data
  if (!result.dataLayers.length && !result.tmsDetected.length && !result.bannerProvider) {
    return null;
  }

  return (
    <div className="mb-12 bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-black text-slate-900 mb-6">Technology Stack</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CMS/CMP Badge - High-Contrast Pill */}
        {result.bannerProvider && (
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex-shrink-0 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CMP</div>
              <div className="font-mono text-sm font-black text-white truncate" style={{ fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>{result.bannerProvider}</div>
            </div>
          </div>
        )}

        {/* TMS Badge - High-Contrast Pill */}
        {result.tmsDetected.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TMS</div>
              <div className="font-mono text-sm font-black text-white truncate" style={{ fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>{result.tmsDetected[0]}</div>
            </div>
          </div>
        )}

        {/* Data Layers - High-Contrast Pills with Pulsing Green Dot */}
        {result.dataLayers.map((dl, idx) => (
          <div key={idx} className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex-shrink-0 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data Layer</div>
              <div className="font-mono text-sm font-black text-white truncate" style={{ fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>{dl}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Lifecycle Waterfall Component
interface LifecycleWaterfallProps {
  requests: RequestLog[];
  consentTimestamp: number;
}

const LifecycleWaterfall: React.FC<LifecycleWaterfallProps> = ({ requests, consentTimestamp }) => {
  const [filter, setFilter] = useState<'all' | 'violations' | 'pre-consent'>('all');
  
  // View Transitions API support for smooth filter animations
  const handleFilterChange = (newFilter: 'all' | 'violations' | 'pre-consent') => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setFilter(newFilter);
      });
    } else {
      setFilter(newFilter);
    }
  };

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => a.timestamp - b.timestamp);
  }, [requests]);

  const minTime = sortedRequests[0]?.timestamp || 0;
  const maxTime = sortedRequests[sortedRequests.length - 1]?.timestamp || minTime;
  const duration = maxTime - minTime || 1;

  // Categorize requests by compliance status - use consentState from backend
  const categorizedRequests = useMemo(() => {
    return sortedRequests.map(req => {
      const isPreConsent = req.consentState === 'pre-consent';
      const isViolation = req.status === 'violation';
      
      // Red (Critical): Marketing/Tracking pixel fired before Consent Gate
      if (isPreConsent && isViolation && req.type === 'pixel') {
        return { ...req, category: 'critical' as const };
      }
      
      // Yellow (Warning): Potential fingerprinting or unclassified third-party
      if (isPreConsent && (isViolation || req.dataTypes.length > 0)) {
        return { ...req, category: 'warning' as const };
      }
      
      // Green (Safe): Strictly necessary (CMP, Hosting, CSS) or post-consent
      return { ...req, category: 'safe' as const };
    });
  }, [sortedRequests, consentTimestamp]);

  // Apply filter - use consentState from backend
  const filteredRequests = useMemo(() => {
    if (filter === 'violations') {
      return categorizedRequests.filter(r => r.status === 'violation');
    }
    if (filter === 'pre-consent') {
      return categorizedRequests.filter(r => r.consentState === 'pre-consent');
    }
    return categorizedRequests;
  }, [categorizedRequests, filter]);

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(241, 245, 249, 0.5);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(203, 213, 225, 0.8);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.9);
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: Scrollable Request Feed
  if (isMobile) {
    return (
      <div className="mb-12 bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-black text-slate-900 mb-4">Request Lifecycle</h3>
        
        {/* Filter Toggle Bar - Mobile */}
        <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1 mb-4 overflow-x-auto">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('violations')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] whitespace-nowrap ${
              filter === 'violations' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Violations
          </button>
          <button
            onClick={() => handleFilterChange('pre-consent')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] whitespace-nowrap ${
              filter === 'pre-consent' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pre-Consent
          </button>
        </div>

        {/* Fixed Height Scroll Container */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3">
          {filteredRequests.map((req) => {
            const categoryColors = {
              critical: {
                bg: 'bg-red-50/50',
                border: 'border-red-200/50',
                shadow: 'shadow-lg shadow-red-500/20'
              },
              warning: {
                bg: 'bg-amber-50/50',
                border: 'border-amber-200/50',
                shadow: ''
              },
              safe: {
                bg: 'bg-emerald-50/50',
                border: 'border-emerald-200/50',
                shadow: ''
              }
            };
            
            const colors = categoryColors[req.category];
            
            return (
              <div
                key={req.id}
                className={`min-h-[44px] p-4 rounded-lg border transition-all ${colors.bg} ${colors.border} ${colors.shadow}`}
                style={{ viewTransitionName: `req-item-${req.id}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">{req.domain}</span>
                  {req.category === 'critical' && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">CRITICAL</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-mono truncate">{req.url}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    req.type === 'pixel' ? 'bg-blue-100 text-blue-700' :
                    req.type === 'script' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {req.type}
                  </span>
                  <span className="text-xs text-slate-500">
                    +{((req.timestamp - minTime) / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* CONSENT GATE Divider - Mobile */}
          <div className="relative my-6 bg-blue-600 text-white px-4 py-3 rounded-lg border-2 border-blue-700">
            <div className="text-center font-black text-sm uppercase tracking-wider mb-1">
              CONSENT GATE
            </div>
            <div className="text-xs text-center text-blue-100 font-medium">
              Pre-Consent above • Post-Consent below
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Vertical Timeline Waterfall
  return (
    <div className="mb-12 bg-white/80 backdrop-blur-md border border-slate-200/15 rounded-lg p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900">Request Lifecycle</h3>
        
        {/* Filter Toggle Bar */}
        <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all min-h-[44px] ${
              filter === 'all' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('violations')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all min-h-[44px] ${
              filter === 'violations' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Violations Only
          </button>
          <button
            onClick={() => handleFilterChange('pre-consent')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all min-h-[44px] ${
              filter === 'pre-consent' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pre-Consent Only
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Critical (Marketing/Tracking pre-consent)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Warning (Potential fingerprinting)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span>Safe (Strictly necessary)</span>
        </div>
      </div>

      {/* Fixed Height Scroll Container */}
      <div className="relative max-h-[500px] overflow-y-auto custom-scrollbar border border-slate-200/15 rounded-lg p-4">
        <div className="relative min-h-[400px]">
          {/* Timeline */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
          
          {/* Requests - Split by consent timestamp */}
          <div className="relative space-y-2">
            {/* Pre-Consent Requests */}
            {filteredRequests
              .filter(req => req.consentState === 'pre-consent')
              .map((req) => {
                const categoryColors = {
                  critical: {
                    bg: 'bg-red-50/50',
                    border: 'border-red-200/50',
                    dot: 'bg-red-500',
                    ring: 'ring-4 ring-red-500/30',
                    shadow: 'shadow-lg shadow-red-500/20'
                  },
                  warning: {
                    bg: 'bg-amber-50/50',
                    border: 'border-amber-200/50',
                    dot: 'bg-amber-500',
                    ring: '',
                    shadow: ''
                  },
                  safe: {
                    bg: 'bg-emerald-50/50',
                    border: 'border-emerald-200/50',
                    dot: 'bg-emerald-500',
                    ring: '',
                    shadow: ''
                  }
                };
                
                const colors = categoryColors[req.category];
                
                return (
                  <div 
                    key={req.id} 
                    className="relative pl-16 py-2"
                    style={{ viewTransitionName: `req-item-${req.id}` }}
                  >
                    <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${colors.dot} ${colors.ring}`}></div>
                    <div className={`p-4 rounded-lg border min-h-[44px] ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900 truncate">{req.domain}</span>
                            {req.category === 'critical' && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">CRITICAL</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-mono truncate">{req.url}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            req.type === 'pixel' ? 'bg-blue-100 text-blue-700' :
                            req.type === 'script' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {req.type}
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            +{((req.timestamp - minTime) / 1000).toFixed(2)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {/* CONSENT GATE Divider - Bold Horizontal */}
            {filteredRequests.some(r => r.consentState === 'post-consent') && filteredRequests.some(r => r.consentState === 'pre-consent') && (
              <div className="relative my-6">
                <div className="absolute left-6 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-500/30 z-20"></div>
                <div className="ml-16 bg-white/95 backdrop-blur-sm border-y-2 border-blue-600 py-3 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-lg text-base font-black uppercase tracking-wider">
                      CONSENT GATE
                    </div>
                  </div>
                  <div className="text-xs text-center text-slate-500 font-medium">
                    Everything above is Pre-Consent • Everything below is Post-Consent Simulation
                  </div>
                </div>
              </div>
            )}

            {/* Post-Consent Requests */}
            {filteredRequests
              .filter(req => req.consentState === 'post-consent')
              .map((req) => {
                const categoryColors = {
                  critical: {
                    bg: 'bg-red-50/50',
                    border: 'border-red-200/50',
                    dot: 'bg-red-500',
                    ring: 'ring-4 ring-red-500/30',
                    shadow: 'shadow-lg shadow-red-500/20'
                  },
                  warning: {
                    bg: 'bg-amber-50/50',
                    border: 'border-amber-200/50',
                    dot: 'bg-amber-500',
                    ring: '',
                    shadow: ''
                  },
                  safe: {
                    bg: 'bg-emerald-50/50',
                    border: 'border-emerald-200/50',
                    dot: 'bg-emerald-500',
                    ring: '',
                    shadow: ''
                  }
                };
                
                const colors = categoryColors[req.category];
                
                return (
                  <div 
                    key={req.id} 
                    className="relative pl-16 py-2"
                    style={{ viewTransitionName: `req-item-${req.id}` }}
                  >
                    <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white ${colors.dot} ${colors.ring}`}></div>
                    <div className={`p-4 rounded-lg border min-h-[44px] ${colors.bg} ${colors.border} ${colors.shadow}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900 truncate">{req.domain}</span>
                            {req.category === 'critical' && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">CRITICAL</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-mono truncate">{req.url}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            req.type === 'pixel' ? 'bg-blue-100 text-blue-700' :
                            req.type === 'script' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {req.type}
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            +{((req.timestamp - minTime) / 1000).toFixed(2)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
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
}

const AuditFindings: React.FC<AuditFindingsProps> = ({ findings, aiAnalysis }) => {
  return (
    <div className="mb-12 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-900">Audit Findings</h3>
        <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
          aiAnalysis.severity === 'Critical' ? 'bg-red-100 text-red-700' :
          aiAnalysis.severity === 'High' ? 'bg-orange-100 text-orange-700' :
          aiAnalysis.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {aiAnalysis.severity} Severity
        </span>
      </div>

      {/* Critical Findings */}
      {findings.critical.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border border-red-200/15 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-red-700">Critical</h4>
          </div>
          <div className="space-y-4">
            {findings.critical.map((finding, idx) => (
              <div key={idx} className="pl-11">
                <h5 className="font-bold text-slate-900 mb-1">{finding.title}</h5>
                <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Findings */}
      {findings.warning.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border border-amber-200/15 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-amber-700">Warning</h4>
          </div>
          <div className="space-y-4">
            {findings.warning.map((finding, idx) => (
              <div key={idx} className="pl-11">
                <h5 className="font-bold text-slate-900 mb-1">{finding.title}</h5>
                <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passed Findings */}
      {findings.passed.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border border-emerald-200/15 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-emerald-700">Passed</h4>
          </div>
          <div className="space-y-4">
            {findings.passed.map((finding, idx) => (
              <div key={idx} className="pl-11">
                <h5 className="font-bold text-slate-900 mb-1">{finding.title}</h5>
                <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiAnalysis.summary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/15 rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-black text-slate-900 mb-3">AI Analysis Summary</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{aiAnalysis.summary}</p>
        </div>
      )}
    </div>
  );
};

