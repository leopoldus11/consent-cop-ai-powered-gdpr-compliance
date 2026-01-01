
import React, { useState } from 'react';
import { Page } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userKey, setUserKey] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button onClick={() => onPageChange('home')} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CONSENT COP</span>
            </button>
            
            <nav className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
                <button onClick={() => onPageChange('enterprise')} className={`hover:text-blue-600 ${currentPage === 'enterprise' ? 'text-blue-600' : ''}`}>Enterprise</button>
                <button onClick={() => onPageChange('docs')} className={`hover:text-blue-600 ${currentPage === 'docs' ? 'text-blue-600' : ''}`}>Docs</button>
              </div>
              
              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 cursor-help" title="Daily scan allowance">
                <span className="text-amber-700 text-[10px] font-black uppercase tracking-wider">2/5 scans left</span>
              </div>

              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JD</div>
                  <button onClick={() => setIsLoggedIn(false)} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase">Logout</button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4" alt="Google" />
                  <span>Login</span>
                </button>
              )}

              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-slate-900">Advanced Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bring Your Own Key (BYOK)</label>
                  <input 
                    type="password" 
                    value={userKey}
                    onChange={(e) => setUserKey(e.target.value)}
                    placeholder="Enter Gemini API Key..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
                    By providing your own key, you get unlimited weekly scans. Your key is stored locally in your browser only.
                  </p>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-blue-600 transition-colors">
                  Save Configuration
                </button>
             </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="font-black text-slate-900 tracking-tight text-lg">CONSENT COP</span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              The automated DPO assistant for high-growth tech teams. Built in Berlin for the global privacy standard.
            </p>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Product</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><button onClick={() => onPageChange('enterprise')} className="hover:text-blue-600 transition-colors">Enterprise</button></li>
              <li><button onClick={() => onPageChange('docs')} className="hover:text-blue-600 transition-colors">Documentation</button></li>
              <li><button onClick={() => onPageChange('security')} className="hover:text-blue-600 transition-colors">Security Architecture</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li><button onClick={() => onPageChange('impressum')} className="hover:text-blue-600 transition-colors font-bold text-slate-800">Impressum (Legal Notice)</button></li>
              <li><button onClick={() => onPageChange('privacy')} className="hover:text-blue-600 transition-colors">Datenschutzerklärung</button></li>
              <li><button onClick={() => onPageChange('terms')} className="hover:text-blue-600 transition-colors">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <span>© 2025 CONSENT COP BERLIN. NO COOKIES WERE HARMED.</span>
          <div className="flex space-x-6">
            <span>Server: Frankfurt (AWS)</span>
            <span>Drone Version: 4.2.1-Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
