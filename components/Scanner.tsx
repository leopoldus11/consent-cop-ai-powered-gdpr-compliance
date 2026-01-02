
import React, { useState, useEffect } from 'react';
import { canUserScan, getUserSession } from '../services/auth';

interface ScannerProps {
  onScanStart: (url: string) => void;
  isLoading: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanStart, isLoading }) => {
  const [url, setUrl] = useState('');
  const [scanCheck, setScanCheck] = useState(canUserScan());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Re-check scan availability when component mounts or user changes
    getUserSession().then(session => {
      if (session) {
        setUser(session.user);
      }
      setScanCheck(canUserScan());
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCheck.allowed) {
      alert(scanCheck.reason || 'Please sign in to use Consent Cop');
      return;
    }
    if (url) onScanStart(url);
  };

  return (
    <div className="max-w-5xl mx-auto pt-2 sm:pt-4 lg:pt-12 pb-4 sm:pb-6 lg:pb-8 px-4">
      {/* Hero Section - Ultra Compact for Mobile */}
      <div className="text-center mb-3 sm:mb-4 lg:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight mb-1.5 sm:mb-2 lg:mb-4 leading-tight px-2">
          GDPR Compliance Testing
          <span className="block text-blue-600 mt-0.5 sm:mt-1 lg:mt-2">for Privacy Professionals</span>
        </h1>
        <p className="text-xs sm:text-sm lg:text-lg xl:text-xl text-slate-600 max-w-2xl mx-auto leading-snug sm:leading-relaxed mb-2 sm:mb-3 lg:mb-6 px-2">
          Automatically detect consent violations, track pre-consent pixel firing, and get AI-powered remediation advice. Built for DPOs, developers, and compliance teams.
        </p>
        
        {/* Value Props - Quick Benefits (Compact on Mobile) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 lg:gap-6 mb-3 sm:mb-4 lg:mb-8">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm lg:text-base text-slate-700">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Real-time Detection</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm lg:text-base text-slate-700">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">AI-Powered Analysis</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm lg:text-base text-slate-700">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {!user && (
        <div className="mb-3 sm:mb-4 lg:mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-blue-800 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Please sign in with Google to start scanning. Free tier includes 5 scans per week.</span>
          </p>
        </div>
      )}
      
      {user && !scanCheck.allowed && (
        <div className="mb-3 sm:mb-4 lg:mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <p className="text-sm text-amber-800 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{scanCheck.reason || 'Weekly scan limit reached'}</span>
          </p>
        </div>
      )}

      {/* Scanner Input - Prominently Centered (Always Visible Above Fold) */}
      <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-200 shadow-lg p-4 sm:p-6 lg:p-8 xl:p-10 mb-3 sm:mb-4 lg:mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading || !scanCheck.allowed}
            placeholder="https://example.com"
            className="block w-full pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !scanCheck.allowed}
          className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg whitespace-nowrap ${
            isLoading || !scanCheck.allowed ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Analyzing...</span>
              <span className="sm:hidden">Scanning...</span>
            </div>
          ) : (
            <>
              <span className="hidden sm:inline">Run Compliance Check</span>
              <span className="sm:hidden">Scan</span>
            </>
          )}
        </button>
      </form>
      
      {/* Technology Stack - Below Input (Compact) */}
      <div className="mt-3 sm:mt-4 lg:mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 text-[9px] sm:text-[10px] lg:text-xs text-slate-400 font-medium uppercase tracking-widest">
        <span>Real Browser Automation</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>Protocol-Level Interception</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>AI-Powered Risk Analysis</span>
      </div>
      </div>
    </div>
  );
};
