
import React from 'react';
import { AIAnalysis } from '../types';

interface AiAdvisorProps {
  analysis: AIAnalysis | null;
  isLoading: boolean;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center animate-pulse min-h-[500px] shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl rotate-45 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
        </div>
        <div className="mt-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">Consulting Gemini AI...</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Cross-referencing detected behaviors with GDPR Article 5 and ePrivacy standards.</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const severityColors = {
    Critical: 'text-red-700 bg-red-100 border-red-200',
    High: 'text-orange-700 bg-orange-100 border-orange-200',
    Medium: 'text-amber-700 bg-amber-100 border-amber-200',
    Low: 'text-green-700 bg-green-100 border-green-200',
  };

  const priorityColors = {
    Immediate: 'bg-red-500',
    Next: 'bg-amber-500',
    Soon: 'bg-blue-500',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden mb-12">
      <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
             <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 13.536a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM16.464 16.464a1 1 0 101.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707z" /></svg>
          </div>
          <div>
            <h2 className="text-white font-bold">Gemini Compliance Advisor</h2>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Live AI Forensic Analysis</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 ${severityColors[analysis.severity]}`}>
          {analysis.severity} SEVERITY
        </div>
      </div>

      <div className="p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center">
               Executive Summary
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              {analysis.summary}
            </p>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
               <h4 className="text-amber-800 font-bold text-xs uppercase tracking-wider mb-3 flex items-center">
                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                 Regulatory Context
               </h4>
               <p className="text-amber-900 text-xs italic leading-relaxed">
                  {analysis.legalContext}
               </p>
            </div>
          </div>

          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Remediation Action Plan</h3>
            <div className="space-y-6">
              {analysis.remediationSteps.map((step, idx) => (
                <div key={idx} className="flex space-x-5 group">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg transform transition-transform group-hover:scale-110 ${priorityColors[step.priority]}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-grow pt-0.5">
                    <div className="flex items-center space-x-3 mb-1.5">
                      <span className="font-bold text-slate-900">{step.title}</span>
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase border border-slate-200">{step.priority}</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-start space-x-4 border border-slate-100">
             <div className="bg-slate-200 p-2 rounded-lg flex-shrink-0">
               <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
             </div>
             <div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Legal Liability Protection Notice</p>
               <p className="text-[11px] text-slate-500 leading-normal italic">
                 {analysis.disclaimer} Consent Cop is a diagnostic tool designed for privacy professionals. This report is generated by Large Language Models and does not constitute formal legal advice. Always verify findings with your legal department.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
