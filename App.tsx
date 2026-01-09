
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Scanner } from './components/Scanner';
import { AuditResults } from './components/AuditResults';
import { EnterprisePage, DocsPage, ImpressumPage, SecurityPage, PrivacyPage } from './components/InformationPages';
import { ScanResult, AIAnalysis, Page } from './types';
import { mockScan } from './services/mockScanner';
import { realScan } from './services/realScanner';
import { analyzeScanResult } from './services/gemini';
import { canUserScan } from './services/auth';
import { generatePDF } from './services/pdfExport';

// Simple Error Boundary Fallback
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen bg-red-950 text-white p-10 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
      <span className="text-4xl font-bold">!</span>
    </div>
    <h1 className="text-3xl font-black mb-4">CRITICAL_UI_CRASH</h1>
    <p className="text-red-200 max-w-lg mb-8 font-mono text-sm bg-black/40 p-6 rounded-xl border border-red-500/30">
      {error.message}
    </p>
    <button 
      onClick={() => window.location.reload()}
      className="px-8 py-3 bg-white text-red-900 rounded-xl font-black uppercase tracking-widest hover:bg-red-100 transition-all"
    >
      Restart Protocol
    </button>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);

  // Global Error Catcher
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[GLOBAL_UI_ERROR]", event.error);
      setRenderError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const startScan = async (url: string) => {
    const scanCheck = canUserScan();
    if (!scanCheck.allowed) {
      alert(scanCheck.reason || 'Authentication required');
      return;
    }

    setIsScanning(true);
    setResult(null);
    setAiAnalysis(null);
    setRenderError(null);
    
    try {
      console.log(`[INITIATE] Scanning: ${url}`);
      const scanData = import.meta.env.VITE_USE_REAL_SCANNER === 'true' 
        ? await realScan(url)
        : await mockScan(url);
      
      if (!scanData || typeof scanData !== 'object') {
        throw new Error("Invalid scanner response payload");
      }

      setResult(scanData);
      
      // Start AI analysis in background
      analyzeScanResult(scanData)
        .then(setAiAnalysis)
        .catch(e => console.error("[AI_FAILURE]", e));
      
    } catch (err: any) {
      console.error("[SCAN_FAILURE]", err);
      alert(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExportingPDF(true);
    try {
      await generatePDF(result, aiAnalysis);
    } catch (error: any) {
      alert(`PDF Export Error: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (renderError) {
    return <ErrorFallback error={renderError} />;
  }

  const renderHome = () => (
    <div className="w-full relative min-h-screen">
      <Scanner onScanStart={startScan} isLoading={isScanning} />
      
      {result && (
        <div id="results-mount-point" className="relative z-20 bg-white">
          <AuditResults 
            result={result}
            aiAnalysis={aiAnalysis}
            onExportPDF={handleExportPDF}
            isExportingPDF={isExportingPDF}
          />
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'enterprise': return <EnterprisePage />;
      case 'docs': return <DocsPage />;
      case 'impressum': return <ImpressumPage />;
      case 'privacy': return <PrivacyPage />;
      case 'security': return <SecurityPage />;
      case 'home':
      default: return renderHome();
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      onScanStart={startScan}
      isScanning={isScanning}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
