import React, { useMemo, useState, useEffect } from 'react';
import { RequestLog, ParameterCategory, ParameterInfo } from '../types';
import { getUserSession } from '../services/auth';

interface ForensicDetailDrawerProps {
  request: RequestLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ForensicDetailDrawer: React.FC<ForensicDetailDrawerProps> = ({ request, isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getUserSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    
    window.addEventListener('user-login', checkAuth);
    window.addEventListener('user-logout', checkAuth);
    return () => {
      window.removeEventListener('user-login', checkAuth);
      window.removeEventListener('user-logout', checkAuth);
    };
  }, []);

  const groupedParameters = useMemo(() => {
    if (!request?.decodedPayload) return null;
    
    const groups: Record<ParameterCategory, ParameterInfo[]> = {} as any;
    request.decodedPayload.parameters.forEach(param => {
      if (!groups[param.category]) {
        groups[param.category] = [];
      }
      groups[param.category].push(param);
    });
    
    return groups;
  }, [request]);

  const piiParameters = useMemo(() => {
    if (!request?.decodedPayload) return [];
    return request.decodedPayload.parameters.filter(p => 
      p.category === ParameterCategory.USER || 
      /email|uid|user|id|visitor|cid|client_id/i.test(`${p.key} ${p.friendlyName || ''}`.toLowerCase())
    );
  }, [request]);

  const isAnonymizationContradiction = useMemo(() => {
    if (!request) return false;
    const claim = (request.legalJustification || '').toLowerCase();
    const hasPII = piiParameters.length > 0;
    const claimsAnonymized = claim.includes('anonym') || claim.includes('pseudonym') || claim.includes('hash');
    
    return hasPII && claimsAnonymized;
  }, [request, piiParameters]);

  if (!isOpen && !request) return null;

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">
                Protocol Forensic
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${request?.status === 'violation' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {request?.status}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {request?.decodedPayload?.type || 'Network Request'} Deep-Dive
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* AI Audit Gated Section */}
          <div className="relative group overflow-hidden bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg font-black tracking-tight">AI Compliance Intelligence</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm">
                  Run our proprietary LLM audit to detect hidden PII leakage and Article 6 violations in this specific payload.
                </p>
              </div>
              
              <div className="relative">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center">
                    <button 
                      disabled
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-slate-500 rounded-full font-black text-xs uppercase tracking-widest border border-slate-700 cursor-not-allowed mb-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Locked</span>
                    </button>
                    <span className="text-[10px] font-bold text-blue-400 animate-pulse">Sign in to unlock AI Forensic Audit</span>
                  </div>
                ) : (
                  <button className="group/btn relative px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Run AI Audit</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Animated background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
          </div>

          {/* Compliance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Legal Claim (CMP)</div>
              <div className="text-sm font-bold text-slate-700 leading-relaxed">
                {request?.legalJustification || "No specific legal justification provided."}
              </div>
            </div>
            <div className={`rounded-xl p-4 border flex flex-col justify-center ${isAnonymizationContradiction ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <div className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">Evidence Status</div>
              <div className="flex items-center font-black text-xs">
                {isAnonymizationContradiction ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Policy Contradiction Found
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Data Alignments Verified
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Decoded Table */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payload Forensics</h3>
            
            {groupedParameters ? (
              <div className="space-y-8">
                {Object.entries(groupedParameters).map(([category, params]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                      {category}
                    </h4>
                    
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 w-1/2">Technical Key / Human Label</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Decoded Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {params.map((param, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {param.key}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="font-bold text-[11px] text-slate-900">
                                      {param.friendlyName || '-'}
                                    </span>
                                    {param.isMandatory && (
                                      <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-50 px-1 rounded border border-blue-100">Required</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div 
                                  className="font-mono text-[11px] text-blue-600 bg-blue-50/30 px-2 py-1 rounded break-all border border-blue-100/50" 
                                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                  {param.value}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
                <div className="text-3xl mb-4">🔬</div>
                <div className="text-sm font-black text-slate-900">No Raw Parameters Detected</div>
                <div className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  This request uses a proprietary encoding format that our parser is currently analyzing.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
            <svg className="w-3 h-3 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Consent Cop Forensic Interceptor v1.0
          </p>
        </div>
      </div>
    </div>
  );
};
