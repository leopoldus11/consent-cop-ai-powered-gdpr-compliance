
import React, { useState } from 'react';
import { RequestLog, BeaconAnalysis } from '../types';
import { getDeepBeaconAnalysis } from '../services/gemini';

interface ViolationListProps {
  requests: RequestLog[];
}

export const ViolationList: React.FC<ViolationListProps> = ({ requests }) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [beaconAnalysis, setBeaconAnalysis] = useState<BeaconAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleOpenModal = (req: RequestLog) => {
    setSelectedRequest(req);
    setBeaconAnalysis(null);
  };

  const triggerAIAnalysis = async () => {
    if (!selectedRequest?.parameters) return;
    setIsAnalyzing(true);
    try {
      const result = await getDeepBeaconAnalysis(selectedRequest.domain, selectedRequest.parameters);
      setBeaconAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const violations = requests.filter(r => r.status === 'violation');
  const preConsentRequests = requests.filter(r => r.status === 'violation' || (r.timestamp < (requests.find(r2 => r2.status === 'allowed')?.timestamp || Infinity)));

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
           <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
             <div className="bg-amber-50 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-slate-900 font-black text-base sm:text-lg mb-0.5 sm:mb-1">Pre-Consent Request Analysis</h3>
               <p className="text-slate-400 text-[10px] sm:text-xs font-medium leading-relaxed">Requests detected before consent - review with privacy policy context</p>
             </div>
           </div>
           <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
             <span className="bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest border border-red-200 whitespace-nowrap">
               {violations.length} Potential Violations
             </span>
             <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium whitespace-nowrap">
               {preConsentRequests.length} total pre-consent requests
             </span>
           </div>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">Network Domain</th>
              <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 hidden sm:table-cell">Audit Trigger</th>
              <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">Data Detected</th>
              <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 hidden md:table-cell">Risk Level</th>
              <th className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {violations.map((req) => {
              // Determine risk level based on data types
              const hasPII = req.dataTypes.some(dt => 
                dt.includes('ID') || dt.includes('Email') || dt.includes('IP Address') || dt.includes('Fingerprint')
              );
              const riskLevel = hasPII ? 'High' : req.dataTypes.length > 0 ? 'Medium' : 'Low';
              const riskColor = riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'amber' : 'slate';
              
              return (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center">
                      {req.domain}
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </div>
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-none mt-1">{req.url}</div>
                    <div className="sm:hidden mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-tighter shadow-sm">{req.type}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 hidden sm:table-cell">
                    <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-tighter shadow-sm">{req.type}</span>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {req.dataTypes.length > 0 ? (
                        req.dataTypes.slice(0, 2).map(dt => (
                          <span key={dt} className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border shadow-sm ${
                            dt.includes('ID') || dt.includes('Email') || dt.includes('IP Address') || dt.includes('Fingerprint')
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{dt}</span>
                        ))
                      ) : (
                        <span className="text-[9px] sm:text-[10px] text-slate-400 italic">No data types detected</span>
                      )}
                      {req.dataTypes.length > 2 && (
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">+{req.dataTypes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 hidden md:table-cell">
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tighter border ${
                      riskLevel === 'High' 
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : riskLevel === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {riskLevel}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-right">
                    <button 
                      onClick={() => handleOpenModal(req)}
                      className="bg-slate-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Deep Inspect</span>
                      <span className="sm:hidden">Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <div className="flex items-center space-x-2 mb-1">
                   <h2 className="text-xl font-black text-slate-900">Beacon Forensic: {selectedRequest.domain}</h2>
                   <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-amber-200">Pre-Consent Request</span>
                 </div>
                 <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Review with privacy policy to determine if violation</p>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="p-8 lg:p-12 overflow-y-auto space-y-10">
               <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Parameters</h4>
                    <span className="text-[10px] font-mono text-slate-300">Format: application/x-www-form-urlencoded</span>
                  </div>
                  <div className="bg-slate-900 text-blue-300 p-6 rounded-3xl font-mono text-[11px] overflow-x-auto shadow-inner border border-white/5 relative">
                    <div className="absolute top-4 right-4 text-slate-600 text-[8px] font-bold">RAW CAPTURE</div>
                    <pre className="leading-relaxed">{JSON.stringify(selectedRequest.parameters, null, 2)}</pre>
                  </div>
               </section>

               <section className="space-y-6">
                  {!beaconAnalysis ? (
                    <div className="bg-blue-600 p-8 rounded-3xl text-center shadow-xl shadow-blue-200">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 13.536a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM16.464 16.464a1 1 0 101.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707z" /></svg>
                      </div>
                      <h3 className="text-white font-bold mb-2">Want a forensic explanation?</h3>
                      <p className="text-blue-100 text-xs mb-6 max-w-xs mx-auto">Gemini AI will deobfuscate these parameters to identify exactly what data is being leaked.</p>
                      <button 
                        onClick={triggerAIAnalysis}
                        disabled={isAnalyzing}
                        className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg"
                      >
                        {isAnalyzing ? 'Analyzing Beacon...' : 'Run Forensic Audit'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tracker Classification</label>
                          <p className="text-slate-900 font-bold text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">{beaconAnalysis.classification}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data Exfiltration</label>
                          <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{beaconAnalysis.dataExfiltration}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Forensic Evidence</label>
                          <p className="text-slate-600 text-xs leading-relaxed bg-red-50 p-4 rounded-2xl border border-red-100">{beaconAnalysis.forensicEvidence}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Technical Remediation</label>
                          <p className="text-blue-700 font-mono text-[10px] leading-relaxed bg-blue-50 p-4 rounded-2xl border border-blue-100">{beaconAnalysis.remediation}</p>
                        </div>
                      </div>
                    </div>
                  )}
               </section>
            </div>

            <div className="p-8 bg-slate-900 border-t border-white/10 flex justify-between items-center">
               <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50 animate-pulse"></div>
                  Audit Drone Secured
               </div>
               <button 
                 onClick={() => setSelectedRequest(null)}
                 className="px-10 py-3 bg-white text-slate-900 font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl"
                >
                  Close Report
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

