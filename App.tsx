
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Scanner } from './components/Scanner';
import { RiskAssessment } from './components/RiskAssessment';
import { Timeline } from './components/Timeline';
import { AiAdvisor } from './components/AiAdvisor';
import { ViolationList } from './components/ViolationList';
import { EnterprisePage, DocsPage, ImpressumPage, SecurityPage } from './components/InformationPages';
import { ScanResult, AIAnalysis, Page } from './types';
import { mockScan } from './services/mockScanner';
import { realScan } from './services/realScanner';
import { analyzeScanResult } from './services/gemini';

// Use real scanner if API URL is configured, otherwise fall back to mock
const USE_REAL_SCANNER = import.meta.env.VITE_USE_REAL_SCANNER === 'true' || import.meta.env.VITE_API_URL;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const startScan = async (url: string) => {
    setIsScanning(true);
    setResult(null);
    setAiAnalysis(null);
    
    try {
      // Use real scanner if configured, otherwise use mock
      const scanData = USE_REAL_SCANNER 
        ? await realScan(url)
        : await mockScan(url);
      
      setResult(scanData);
      
      setIsAiLoading(true);
      const aiData = await analyzeScanResult(scanData);
      setAiAnalysis(aiData);
    } catch (err: any) {
      console.error("Scan failed", err);
      alert(`Scan failed: ${err.message || 'Unknown error'}\n\n${USE_REAL_SCANNER ? 'Make sure the scanner API server is running on port 3001.' : ''}`);
    } finally {
      setIsScanning(false);
      setIsAiLoading(false);
    }
  };

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Scanner onScanStart={startScan} isLoading={isScanning} />
      
      {result ? (
        <div className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Findings</h2>
                <p className="text-slate-500 text-sm mt-1">Deep inspection report for {result.url}</p>
              </div>
              <div className="flex space-x-3">
                <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-slate-200">
                  CMP: {result.bannerProvider || 'UNKNOWN'}
                </span>
                <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                  TMS: {result.tmsDetected[0] || 'NONE'}
                </span>
              </div>
            </div>

            <AiAdvisor analysis={aiAnalysis} isLoading={isAiLoading} />

            <Timeline requests={result.requests} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm group">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-slate-900 font-black text-xs uppercase tracking-widest">Pre-Consent State</h3>
                  <span className="bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Default Capture</span>
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-inner group-hover:border-red-200 transition-colors">
                  <img src={result.screenshots.before} alt="Before Consent" className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-red-500/5"></div>
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">AUDIT DRONE CAPTURE</div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400 font-medium">Initial page render before user interaction with the consent gateway.</p>
              </div>
              
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm group">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-slate-900 font-black text-xs uppercase tracking-widest">Post-Consent Simulation</h3>
                  <span className="bg-emerald-100 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Simulated Accept</span>
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-inner group-hover:border-emerald-200 transition-colors">
                  <img src={result.screenshots.after} alt="After Consent" className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-emerald-500/5"></div>
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">AUDIT DRONE CAPTURE</div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400 font-medium">Render state after Consent Cop simulated a "Accept All" button interaction.</p>
              </div>
            </div>
            
            {result.screenshots.before.includes('unsplash.com') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                <p className="text-[10px] text-amber-800 flex items-center">
                  <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  <span className="font-semibold">Note:</span> Screenshots shown are placeholder images. Real browser automation is required to capture actual page screenshots.
                </p>
              </div>
            )}

            <ViolationList requests={result.requests} />

            <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
              </div>
              <h3 className="text-xl font-black mb-2 tracking-tight">Audit Technology Stack</h3>
              <p className="text-slate-400 text-sm mb-8 max-w-lg leading-relaxed">
                Consent Cop utilizes deep network forensic interception. We capture headers, payloads, and cookies at the protocol level.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {result.dataLayers.map(dl => (
                  <div key={dl} className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                     <span className="text-[10px] font-bold tracking-tight uppercase">{dl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <RiskAssessment result={result} />
          </div>
        </div>
      ) : !isScanning ? (
        <div className="mt-32 flex flex-col items-center justify-center text-center pb-32">
           <div className="w-32 h-32 bg-white rounded-[2rem] shadow-2xl shadow-slate-100 flex items-center justify-center mb-10 transform rotate-6 hover:rotate-0 transition-transform duration-500 border border-slate-50">
             <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Automated Compliance Drone</h2>
           <p className="text-slate-500 mt-4 max-w-sm mx-auto leading-relaxed font-medium">
             Deploy an audit drone to crawl your site. We catch pixels that fire before consent, every single time.
           </p>
        </div>
      ) : null}
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'enterprise': return <EnterprisePage />;
      case 'docs': return <DocsPage />;
      case 'impressum': return <ImpressumPage />;
      case 'security': return <SecurityPage />;
      case 'home':
      default: return renderHome();
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderContent()}
    </Layout>
  );
};

export default App;
