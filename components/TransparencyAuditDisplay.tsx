import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Globe, BookOpen, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { TransparencyResult } from '../types';

interface TransparencyAuditDisplayProps {
  transparency: TransparencyResult | undefined;
}

export const TransparencyAuditDisplay: React.FC<TransparencyAuditDisplayProps> = ({ transparency }) => {
  if (!transparency) return null;

  const {
    articleCompliance,
    hasDataCategories,
    hasThirdPartyList,
    dataCategoriesFound,
    thirdPartiesFound,
    evidence
  } = transparency;

  const complianceStyles = {
    FULL: { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'Full Compliance' },
    PARTIAL: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'Partial Compliance' },
    NONE: { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', text: 'Non-Compliant' }
  };

  const style = complianceStyles[articleCompliance] || complianceStyles.NONE;

  return (
    <div className="mb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 animate-pulse"></div>
          <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Article 13 Transparency Audit</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">EDPB 2026 Disclosure Verification</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Status Card */}
        <div className={`p-8 rounded-[2rem] border ${style.border} ${style.bg} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck className={`w-24 h-24 ${style.color}`} />
          </div>
          
          <div className="relative z-10">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audit Verdict</div>
            <div className={`text-4xl font-black ${style.color} tracking-tighter mb-4`}>
              {style.text}
            </div>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-8">
              {evidence}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Categories</span>
                {hasDataCategories ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Third-Party List</span>
                {hasThirdPartyList ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          </div>
        </div>

        {/* Categories & Parties List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Categories */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Collected Categories</h4>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {dataCategoriesFound && Array.isArray(dataCategoriesFound) && dataCategoriesFound.length > 0 ? (
                  dataCategoriesFound.map((cat, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase">
                      {cat}
                    </span>
                  ))
                ) : (
                  <div className="w-full py-4 text-center text-xs text-slate-400 font-medium italic">
                    No explicit data categories identified in first-layer banner.
                  </div>
                )}
              </div>
            </div>

            {/* Third Parties */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Named Recipients</h4>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {thirdPartiesFound && Array.isArray(thirdPartiesFound) && thirdPartiesFound.length > 0 ? (
                  thirdPartiesFound.map((party, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 uppercase">
                      {party}
                    </span>
                  ))
                ) : (
                  <div className="w-full py-4 text-center text-xs text-slate-400 font-medium italic">
                    Generic terms used (e.g., "partners"). No specific companies named.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legal Note */}
          <div className="p-6 bg-slate-900 rounded-3xl text-slate-400">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-4 h-4 text-slate-500" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Regulatory Context</h4>
            </div>
            <p className="text-[11px] leading-relaxed font-medium">
              Under <span className="text-white">GDPR Article 13(1)(e)</span> and <span className="text-white">EDPB 2026 Guidelines</span>, consent banners must explicitly name the third-party recipients of personal data. Generic references such as "our partners" or "advertising providers" are no longer considered sufficient for informed consent. Sites failing this audit are at high risk for Article 13 transparency fines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

