
import React, { useState } from 'react';

interface ScannerProps {
  onScanStart: (url: string) => void;
  isLoading: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanStart, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) onScanStart(url);
  };

  return (
    <div className="max-w-4xl mx-auto pt-12 pb-8 px-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            placeholder="https://example.com"
            className="block w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-8 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${
            isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </div>
          ) : (
            'Run Compliance Check'
          )}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-slate-400 font-medium uppercase tracking-widest">
        <span>Deep Browser Emulation</span>
        <span>•</span>
        <span>Network Forensics</span>
        <span>•</span>
        <span>AI Risk Scoring</span>
      </div>
    </div>
  );
};
