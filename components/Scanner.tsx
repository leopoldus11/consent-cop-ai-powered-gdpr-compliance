
import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { canUserScan, getUserSession } from '../services/auth';
import { ScannerProgress } from './ScannerProgress';

interface ScannerProps {
  onScanStart: (url: string) => void;
  isLoading: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanStart, isLoading }) => {
  const [url, setUrl] = useState('');
  const [scanCheck, setScanCheck] = useState(canUserScan());
  
  useEffect(() => {
    setScanCheck(canUserScan());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) onScanStart(url);
  };

  return (
    <div className="w-full text-white py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        {!isLoading && (
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-6xl font-black mb-4">
              Forensic Data Transparency
            </h1>
            <p className="text-slate-400 text-lg">
              Simulating EDPB 2026 Transparency Sweeps to unmask hidden tracking.
            </p>
          </div>
        )}

        {/* Scanner Card */}
        <div className="bg-slate-900/50 rounded-[2rem] border border-white/10 p-6">
          {isLoading ? (
            <ScannerProgress isVisible={isLoading} />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Terminal className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to audit..."
                  className="block w-full pl-14 pr-6 py-4 rounded-xl bg-black text-white border border-white/10 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black flex items-center justify-center gap-2 transition-all"
              >
                <span>Start Audit</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
