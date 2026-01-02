
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { AuthProvider } from './AuthProvider';
import { LoginButton } from './LoginButton';
import { ProfileDropdown } from './ProfileDropdown';
import { getUserSession, clearUserSession, canUserScan, type User } from '../services/auth';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onScanStart?: (url: string) => void;
  isScanning?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange, onScanStart, isScanning }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userKey, setUserKey] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Check for existing session on mount (async due to decryption)
    getUserSession().then(session => {
      if (session) {
        setUser(session.user);
      }
    });
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMobileMenu && !target.closest('header')) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMobileMenu]);

  // Close mobile menu on page change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [currentPage]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
  };

  const scanCheck = canUserScan();
  const userInitials = user ? (user.name || user.email).substring(0, 2).toUpperCase() : 'JD';

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Desktop: Logo on left */}
            <button 
              onClick={() => {
                onPageChange('home');
                setShowMobileMenu(false);
              }} 
              className="hidden lg:flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CONSENT COP</span>
            </button>

            {/* Mobile: Hamburger and Logo on left */}
            <div className="lg:hidden flex items-center space-x-3">
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      setShowMobileMenu(!showMobileMenu);
                    });
                  } else {
                    setShowMobileMenu(!showMobileMenu);
                  }
                }}
                className="p-2 text-slate-600 hover:text-blue-600 transition-colors relative w-10 h-10 flex items-center justify-center z-50"
                aria-label="Toggle menu"
              >
                <div className="relative w-6 h-6">
                  {/* Static two lines - no animation */}
                  <span className="absolute top-1.5 left-0 w-6 h-0.5 bg-current"></span>
                  <span className="absolute top-4 left-0 w-6 h-0.5 bg-current"></span>
                </div>
              </button>
              <button 
                onClick={() => {
                  onPageChange('home');
                  setShowMobileMenu(false);
                }} 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity flex-shrink-0"
              >
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">CONSENT COP</span>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <div className="flex space-x-6 text-sm font-medium text-slate-500">
                <button onClick={() => onPageChange('enterprise')} className={`hover:text-blue-600 ${currentPage === 'enterprise' ? 'text-blue-600' : ''}`}>Enterprise</button>
                <button onClick={() => onPageChange('docs')} className={`hover:text-blue-600 ${currentPage === 'docs' ? 'text-blue-600' : ''}`}>Docs</button>
              </div>
              
              <div className="h-6 w-px bg-slate-200"></div>

              {user && (
                <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200" title={scanCheck.reason || 'Weekly scan allowance'}>
                  <span className="text-amber-700 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                    {scanCheck.scansRemaining}/5 scans left
                  </span>
                </div>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-transparent hover:border-blue-200 transition-colors" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-transparent hover:border-blue-200 transition-colors">
                        {userInitials}
                      </div>
                    )}
                  </button>
                  {showProfileDropdown && (
                    <ProfileDropdown
                      user={user}
                      onLogout={handleLogout}
                      onSettings={() => setShowSettings(true)}
                      onClose={() => setShowProfileDropdown(false)}
                    />
                  )}
                </div>
              ) : (
                <LoginButton onLoginSuccess={handleLoginSuccess} />
              )}
            </nav>

            {/* Mobile: Right side - Sign in button or profile */}
            <div className="flex lg:hidden items-center space-x-3">
              {user && (
                <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200" title={scanCheck.reason || 'Weekly scan allowance'}>
                  <span className="text-amber-700 text-xs sm:text-sm font-black uppercase tracking-wider">
                    {scanCheck.scansRemaining}/5
                  </span>
                </div>
              )}

              {user ? (
                <button
                  onClick={() => {
                    if ('startViewTransition' in document) {
                      (document as any).startViewTransition(() => {
                        setShowProfileModal(true);
                      });
                    } else {
                      setShowProfileModal(true);
                    }
                  }}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full border-2 border-transparent hover:border-blue-200 transition-colors" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold border-2 border-transparent hover:border-blue-200 transition-colors">
                      {userInitials}
                    </div>
                  )}
                </button>
              ) : (
                <LoginButton onLoginSuccess={handleLoginSuccess} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu - Full Screen Overlay with Blur (Material Design) */}
        <div 
          className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ease-out ${
            showMobileMenu 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible pointer-events-none'
          }`}
          onClick={() => {
            if ('startViewTransition' in document) {
              (document as any).startViewTransition(() => {
                setShowMobileMenu(false);
              });
            } else {
              setShowMobileMenu(false);
            }
          }}
        >
          {/* Backdrop with blur */}
          <div className={`absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-all duration-300 ${
            showMobileMenu ? 'opacity-100' : 'opacity-0'
          }`}></div>
          
          {/* Menu Panel - Slides from left to right */}
          <div 
            className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-all duration-300 ease-out ${
              showMobileMenu 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-full opacity-0'
            }`}
            style={{
              maxHeight: '100vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header with Consent Cop logo and close button */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
              <button 
                onClick={() => {
                  onPageChange('home');
                  setShowMobileMenu(false);
                }} 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">CONSENT COP</span>
              </button>
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      setShowMobileMenu(false);
                    });
                  } else {
                    setShowMobileMenu(false);
                  }
                }}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-700 active:text-slate-900 transition-colors rounded-full hover:bg-slate-100 active:bg-slate-200"
                aria-label="Close menu"
              >
                {/* Back arrow instead of X - more intuitive for side menu */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            <div className="px-4 py-6 space-y-1">
              {/* Navigation Links */}
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      onPageChange('enterprise');
                      setShowMobileMenu(false);
                    });
                  } else {
                    onPageChange('enterprise');
                    setShowMobileMenu(false);
                  }
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                  currentPage === 'enterprise'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                Enterprise
              </button>
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      onPageChange('docs');
                      setShowMobileMenu(false);
                    });
                  } else {
                    onPageChange('docs');
                    setShowMobileMenu(false);
                  }
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                  currentPage === 'docs'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Mobile Profile Context Menu - Slides from right to left */}
      {showProfileModal && user && (
        <div 
          className={`lg:hidden fixed inset-0 z-[100] transition-all duration-300 ease-out ${
            showProfileModal 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible pointer-events-none'
          }`}
          onClick={() => {
            if ('startViewTransition' in document) {
              (document as any).startViewTransition(() => {
                setShowProfileModal(false);
              });
            } else {
              setShowProfileModal(false);
            }
          }}
        >
          {/* Backdrop with blur */}
          <div className={`absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-all duration-300 ${
            showProfileModal ? 'opacity-100' : 'opacity-0'
          }`}></div>
          
          {/* Context Menu Panel - Slides from right to left */}
          <div 
            className={`absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-all duration-300 ease-out ${
              showProfileModal 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-full opacity-0'
            }`}
            style={{
              maxHeight: '100vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header with Account title and close button */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-slate-900">Account</h2>
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      setShowProfileModal(false);
                    });
                  } else {
                    setShowProfileModal(false);
                  }
                }}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-700 active:text-slate-900 transition-colors rounded-full hover:bg-slate-100 active:bg-slate-200"
                aria-label="Close menu"
              >
                {/* Back arrow pointing left (since menu comes from right) */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* User Info Section */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {userInitials}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
            </div>
            
            {/* Menu Options */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      setShowSettings(true);
                      setShowProfileModal(false);
                    });
                  } else {
                    setShowSettings(true);
                    setShowProfileModal(false);
                  }
                }}
                className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  if ('startViewTransition' in document) {
                    (document as any).startViewTransition(() => {
                      handleLogout();
                      setShowProfileModal(false);
                    });
                  } else {
                    handleLogout();
                    setShowProfileModal(false);
                  }
                }}
                className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
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
              <li><button onClick={() => onPageChange('privacy')} className="hover:text-blue-600 transition-colors font-bold text-slate-800">Datenschutzerklärung</button></li>
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
    </AuthProvider>
  );
};
