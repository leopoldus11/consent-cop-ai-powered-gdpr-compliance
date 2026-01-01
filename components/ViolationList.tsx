
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center space-x-3">
           <div className="bg-red-50 p-2 rounded-lg">
             <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
           </div>
           <div>
             <h3 className="text-slate-900 font-black">Violation Forensic Deep-Dive</h3>
             <p className="text-slate-400 text-xs font-medium">Network packets intercepted prior to consent</p>
           </div>
         </div>
         <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{violations.length} Critical Issues</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Network Domain</th>
              <th className="px-8 py-4">Audit Trigger</th>
              <th className="px-8 py-4">Intercepted Payload</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {violations.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-900 text-sm flex items-center">
                    {req.domain}
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] mt-1">{req.url}</div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-tighter shadow-sm">{req.type}</span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {req.dataTypes.map(dt => (
                      <span key={dt} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 shadow-sm">{dt}</span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => handleOpenModal(req)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                  >
                    Deep Inspect
                  </button>
                </td>
              </tr>
            ))}
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
                   <span className="bg-red-100 text-red-600 text-[9px] font-black px-2 py-0.5 rounded uppercase">Pre-Consent Request</span>
                 </div>
                 <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Intercepted Network Payload Breakdown</p>
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
