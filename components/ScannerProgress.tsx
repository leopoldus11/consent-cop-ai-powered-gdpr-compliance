
import React, { useState, useEffect } from 'react';

interface ScannerProgressProps {
  isVisible: boolean;
}

interface ProgressPhase {
  id: string;
  label: string;
  estimatedTime: number; // in seconds
  status: 'pending' | 'active' | 'completed';
}

export const ScannerProgress: React.FC<ScannerProgressProps> = ({ isVisible }) => {
  const [phases, setPhases] = useState<ProgressPhase[]>([
    { id: 'init', label: 'Initializing Scanner', estimatedTime: 0, status: 'pending' },
    { id: 'nav', label: 'Loading Website', estimatedTime: 1, status: 'pending' },
    { id: 'banner', label: 'Detecting Consent Banners', estimatedTime: 5, status: 'pending' },
    { id: 'interact', label: 'Interacting with Banner', estimatedTime: 7, status: 'pending' },
    { id: 'network', label: 'Analyzing Network Traffic', estimatedTime: 10, status: 'pending' },
    { id: 'ai', label: 'AI Verification (Gemini)', estimatedTime: 25, status: 'pending' },
  ]);

  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setSeconds(0);
      setPhases(prev => prev.map(p => ({ ...p, status: 'pending' })));
      return;
    }

    const startTime = Date.now();
    
    // Timer for seconds counter
    const timerInterval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Progress bar logic (Zeno's paradox style)
    // Moves to 80% over 30 seconds, then slows down
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      setProgress(prev => {
        if (elapsed < 30) {
          // Linear progress up to 80%
          return Math.min(80, (elapsed / 30) * 80);
        } else {
          // Asymptotic progress towards 99%
          const remaining = 99 - prev;
          return prev + (remaining * 0.05); // Move 5% of remaining distance each second
        }
      });

      // Update phases based on elapsed time
      setPhases(currentPhases => 
        currentPhases.map(phase => {
          if (elapsed >= phase.estimatedTime) {
            // Check if next phase has started
            const nextPhaseIndex = currentPhases.findIndex(p => p.id === phase.id) + 1;
            const nextPhase = currentPhases[nextPhaseIndex];
            
            if (!nextPhase || elapsed < nextPhase.estimatedTime) {
              return { ...phase, status: 'active' };
            } else {
              return { ...phase, status: 'completed' };
            }
          }
          return phase;
        })
      );
    }, 500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 shadow-inner relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Audit Drone In Progress
            </h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">Deep browser emulation & network forensic analysis</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Elapsed</span>
            <span className="text-lg font-mono font-bold text-blue-600">{seconds}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Scan Intensity</span>
            <span className="text-sm font-bold text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-lg shadow-blue-500/20 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Stepper / Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {phases.map((phase, idx) => (
            <div key={phase.id} className="flex items-center gap-4 group">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                phase.status === 'completed' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' :
                phase.status === 'active' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 animate-pulse' :
                'bg-slate-200'
              }`}>
                {phase.status === 'completed' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : phase.status === 'active' ? (
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                ) : (
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                )}
              </div>
              <span className={`text-sm font-bold transition-colors duration-300 ${
                phase.status === 'completed' ? 'text-slate-900' :
                phase.status === 'active' ? 'text-blue-600' :
                'text-slate-400'
              }`}>
                {phase.label}
              </span>
              {phase.status === 'active' && (
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse ml-auto">Running</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Loading Hint */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Did you know?</span> Real browser automation takes time because we simulate actual user behavior and wait for all tracking pixels to fire naturally. This ensures 100% accuracy in detecting GDPR violations.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(300px); opacity: 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-scan {
          animation: scan 4s infinite linear;
        }
      `}} />
    </div>
  );
};


