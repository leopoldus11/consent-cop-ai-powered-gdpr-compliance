import React, { useState, useEffect } from 'react';
import { getUserSession } from '../services/auth';

interface IntelligenceAuditButtonProps {
  onClick: () => void;
  className?: string;
}

export const IntelligenceAuditButton: React.FC<IntelligenceAuditButtonProps> = ({ onClick, className = '' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getUserSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();
    
    // Listen for auth events
    window.addEventListener('user-login', checkAuth);
    window.addEventListener('user-logout', checkAuth);
    
    return () => {
      window.removeEventListener('user-login', checkAuth);
      window.removeEventListener('user-logout', checkAuth);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`h-10 w-48 bg-slate-100 animate-pulse rounded-lg ${className}`}></div>
    );
  }

  return (
    <div className="relative group">
      {!isAuthenticated && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Login to unlock AI Forensic Analysis
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
      
      <button
        onClick={isAuthenticated ? onClick : undefined}
        disabled={!isAuthenticated}
        className={`
          relative flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300
          ${isAuthenticated 
            ? 'bg-white border border-blue-200 text-blue-600 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95' 
            : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'}
          ${className}
        `}
      >
        <svg className={`w-4 h-4 ${isAuthenticated ? 'text-blue-500 group-hover:animate-pulse' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Forensic Audit</span>
        
        {isAuthenticated && (
          <div className="absolute inset-0 rounded-lg bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-2 ring-blue-400 ring-offset-0 ring-opacity-0 group-hover:ring-opacity-20"></div>
        )}
      </button>
    </div>
  );
};

