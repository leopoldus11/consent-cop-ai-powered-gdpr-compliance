import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RequestLog } from '../types';

interface TimelineProps {
  requests: RequestLog[];
}

interface DomainGroup {
  domain: string;
  requests: RequestLog[];
  violations: RequestLog[];
  compliant: RequestLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ requests }) => {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [hoveredRequest, setHoveredRequest] = useState<RequestLog | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pre-consent' | 'post-consent'>('pre-consent');
  const [searchQuery, setSearchQuery] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const sorted = useMemo(() => [...requests].sort((a, b) => a.timestamp - b.timestamp), [requests]);
  const minTime = sorted[0]?.timestamp || 0;
  const maxTime = sorted[sorted.length - 1]?.timestamp || 0;
  const duration = maxTime - minTime || 1;

  // Find consent timestamp
  const violations = sorted.filter(r => r.status === 'violation');
  const compliant = sorted.filter(r => r.status === 'allowed');
  const consentTimestamp = violations.length > 0 && compliant.length > 0
    ? (compliant[0]?.timestamp || minTime + (duration * 0.7))
    : minTime + (duration * 0.7);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = sorted;
    
    if (filterStatus === 'pre-consent') {
      filtered = filtered.filter(r => r.timestamp < consentTimestamp);
    } else if (filterStatus === 'post-consent') {
      filtered = filtered.filter(r => r.timestamp >= consentTimestamp);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.domain.toLowerCase().includes(query) || 
        r.url.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sorted, filterStatus, searchQuery, consentTimestamp]);

  // Group by domain
  const domainGroups = useMemo(() => {
    const groups = new Map<string, DomainGroup>();
    
    filteredRequests.forEach(req => {
      if (!groups.has(req.domain)) {
        groups.set(req.domain, {
          domain: req.domain,
          requests: [],
          violations: [],
          compliant: [],
        });
      }
      const group = groups.get(req.domain)!;
      group.requests.push(req);
      if (req.status === 'violation') {
        group.violations.push(req);
      } else {
        group.compliant.push(req);
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aFirst = a.requests[0]?.timestamp || 0;
      const bFirst = b.requests[0]?.timestamp || 0;
      return aFirst - bFirst;
    });
  }, [filteredRequests]);

  // Calculate time markers
  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    const step = duration > 30000 ? 10000 : duration > 10000 ? 5000 : 1000;
    for (let t = 0; t <= duration; t += step) {
      markers.push(t);
    }
    return markers;
  }, [duration]);

  // Get color for request dot
  const getRequestDotColor = (req: RequestLog): string => {
    if (req.status === 'violation') {
      return 'bg-red-500 border-red-600';
    }
    // Color by type for allowed requests
    if (req.type === 'script') return 'bg-blue-500 border-blue-600';
    if (req.type === 'xhr') return 'bg-emerald-500 border-emerald-600';
    if (req.type === 'pixel') return 'bg-amber-500 border-amber-600';
    return 'bg-slate-400 border-slate-500';
  };

  // Get size for request dot (larger for violations)
  const getRequestDotSize = (req: RequestLog): string => {
    return req.status === 'violation' ? 'w-3 h-3' : 'w-2 h-2';
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // Scroll to table row when dot is clicked
  const handleDotClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    const rowElement = document.getElementById(`request-row-${requestId}`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      rowElement.classList.add('bg-blue-50');
      setTimeout(() => {
        rowElement.classList.remove('bg-blue-50');
      }, 2000);
    }
  };

  const consentPosition = ((consentTimestamp - minTime) / duration) * 100;
  const pageLoadTime = minTime > 0 ? ((minTime - minTime) / 1000).toFixed(2) : '0.00';
  const preConsentCount = violations.length;
  const postConsentCount = compliant.length;
  const totalRequests = sorted.length;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-black text-base sm:text-lg mb-1">Request Lifecycle</h3>
            <p className="text-slate-400 text-[10px] sm:text-xs font-medium leading-relaxed">Pre-consent network requests that may violate GDPR compliance</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black tracking-widest uppercase flex-shrink-0">
            <div className="flex items-center space-x-1.5">
              <div className="flex space-x-0.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-blue-500"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-emerald-500"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-amber-500"></span>
              </div>
              <span className="text-slate-500 hidden xs:inline">Type</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 mr-1.5 sm:mr-2 shadow-sm shadow-red-200"></span>
              <span className="text-slate-500 hidden xs:inline">Violation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Filters Bar */}
      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Stats */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Page Load:</span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Load:</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">{pageLoadTime}s</span>
            </div>
            <div className="w-px h-5 sm:h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Pre-Consent:</span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Pre:</span>
              <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black">{preConsentCount}</span>
            </div>
            <div className="w-px h-5 sm:h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Post-Consent:</span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Post:</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black">{postConsentCount}</span>
            </div>
            <div className="w-px h-5 sm:h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Total:</span>
              <span className="bg-slate-900 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black">{totalRequests}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setFilterStatus('pre-consent')}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === 'pre-consent'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
              >
                Pre-Consent
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
            </div>

            {/* Search Field */}
            <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
              <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-1.5 bg-white border border-slate-200 rounded-full text-[10px] sm:text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Scale */}
      <div className="relative mb-4 pb-2 border-b border-slate-100">
        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
          {timeMarkers.map((marker, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-px h-2 bg-slate-200 mb-1"></div>
              <span>{((marker / 1000).toFixed(marker >= 1000 ? 0 : 1))}s</span>
            </div>
          ))}
        </div>
        </div>
        
      {/* Horizontal Timeline with Dots */}
      <div 
        ref={timelineRef}
        className="relative h-16 mb-8 bg-gradient-to-r from-red-50 via-slate-50 to-emerald-50 rounded-lg border border-slate-100 overflow-x-auto"
      >
        {/* Consent milestone line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-slate-400 z-20 pointer-events-none"
          style={{ left: `${consentPosition}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-full text-[9px] font-black shadow-lg whitespace-nowrap">
            CONSENT ACTION
          </div>
        </div>

        {/* Request dots */}
        <div className="absolute inset-0 flex items-center">
          {filteredRequests.map((req) => {
            const left = ((req.timestamp - minTime) / duration) * 100;
            const isHovered = hoveredRequest?.id === req.id;
            const isSelected = selectedRequestId === req.id;
            const isPreConsent = req.timestamp < consentTimestamp;

            return (
              <div
                key={req.id}
                className="absolute group cursor-pointer z-10 transition-all"
                style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                onMouseEnter={() => setHoveredRequest(req)}
                onMouseLeave={() => setHoveredRequest(null)}
                onClick={() => handleDotClick(req.id)}
              >
                {/* Dot */}
                <div
                  className={`${getRequestDotColor(req)} ${getRequestDotSize(req)} rounded-full border-2 transition-all ${
                    isHovered || isSelected ? 'scale-150 shadow-lg ring-2 ring-blue-400' : 'hover:scale-125'
                  }`}
                >
                  {isHovered && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
                      <div className="bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-bold shadow-lg">
                        {req.domain}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                         </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Collapsible Table (Lighthouse-style) */}
      <div ref={tableRef} className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {domainGroups.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {domainGroups.map((group) => {
              const isExpanded = expandedDomains.has(group.domain);
              const hasMultiple = group.requests.length > 1;

              return (
                <div key={group.domain} className="bg-white">
                  {/* Domain Header (Collapsible) */}
                  <button
                    onClick={() => hasMultiple && toggleDomain(group.domain)}
                    className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                      hasMultiple ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {hasMultiple && (
                        <svg 
                          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-bold text-slate-900 truncate">{group.domain}</div>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                          {group.violations.length > 0 && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                              {group.violations.length} violation{group.violations.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {group.compliant.length > 0 && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                              {group.compliant.length} allowed
                            </span>
                          )}
                          {hasMultiple && !isExpanded && (
                            <span className="text-slate-400">+{group.requests.length - 1} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono ml-4">
                      {group.requests.length} request{group.requests.length > 1 ? 's' : ''}
                    </div>
                  </button>

                  {/* Request Rows (Collapsible) */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">URL</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Timing</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Types</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.requests.map((req) => {
                            const isSelected = selectedRequestId === req.id;
                            const isPreConsent = req.timestamp < consentTimestamp;

                            return (
                              <tr
                                key={req.id}
                                id={`request-row-${req.id}`}
                                className={`hover:bg-slate-50 transition-colors ${
                                  isSelected ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => setSelectedRequestId(req.id)}
                              >
                                <td className="px-6 py-4">
                                  <div className="font-mono text-xs text-slate-900 break-all max-w-md">{req.url}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                                    req.type === 'script' ? 'bg-blue-100 text-blue-700' :
                                    req.type === 'xhr' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {req.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                                    req.status === 'violation' 
                                      ? 'bg-red-100 text-red-700 border border-red-200' 
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {req.status}
                                  </span>
                                  {isPreConsent && (
                                    <div className="text-[8px] text-red-600 font-bold mt-1">PRE-CONSENT</div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs text-slate-600">
                                    {((req.timestamp - minTime) / 1000).toFixed(2)}s
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {req.dataTypes.slice(0, 3).map(dt => (
                                      <span key={dt} className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                        {dt}
                                      </span>
                                    ))}
                                    {req.dataTypes.length > 3 && (
                                      <span className="text-[8px] text-slate-400">+{req.dataTypes.length - 3}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No requests match the current filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest pt-4 mt-6 border-t border-slate-50 gap-2">
        <div className="flex items-center space-x-4">
        <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          T=0.00s Page Load
        </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="font-mono text-[9px]">
            {preConsentCount} pre-consent • {postConsentCount} post-consent
          </span>
        </div>
        <span className="font-mono text-[9px]">Total: {Math.round(duration/1000)}s</span>
      </div>
    </div>
  );
};
