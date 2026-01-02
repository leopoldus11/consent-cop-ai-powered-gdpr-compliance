
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { canUserScan, getUserSession } from '../services/auth';
import { UpgradePrompt } from './UpgradePrompt';

interface ScannerProps {
  onScanStart: (url: string) => void;
  isLoading: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanStart, isLoading }) => {
  const [url, setUrl] = useState('');
  const [scanCheck, setScanCheck] = useState(canUserScan());
  const [user, setUser] = useState<any>(null);
  const isLoggedOut = !user;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const scanCardRef = useRef<HTMLDivElement>(null);

  // Function to update user state and scan check
  const updateAuthState = async () => {
    const session = await getUserSession();
    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
    }
    setScanCheck(canUserScan());
  };

  // SIMPLE SOLUTION: Calculate ONE equal spacing value and use it everywhere
  // Formula: (available space - all content) / number of gaps = equal spacing
  useLayoutEffect(() => {
    if (!containerRef.current || !heroRef.current) return;

    const calculateEqualSpacing = () => {
      const container = containerRef.current!;
      const containerHeight = container.offsetHeight;
      const headerHeight = 64; // 4rem
      
      // Get safe area bottom
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('env(safe-area-inset-bottom)')
          .replace('px', '') || '0'
      ) || 0;
      
      // Measure content heights (natural heights)
      const heroHeight = heroRef.current!.offsetHeight || 0;
      const messageHeight = (isLoggedOut && messageRef.current) 
        ? messageRef.current.offsetHeight 
        : 0;
      
      // Measure scan card's natural height (now that flex-1 is removed)
      const scanCardHeight = scanCardRef.current 
        ? scanCardRef.current.offsetHeight || scanCardRef.current.scrollHeight
        : 200; // Fallback estimate
      
      // Calculate: available = container - header - safe area
      const availableHeight = containerHeight - headerHeight - safeAreaBottom;
      
      // Calculate equal spacing
      if (isLoggedOut) {
        // 4 gaps needed: after header, after hero, after message, padding-bottom
        // Content: hero + message + scan card (natural height)
        const totalContent = heroHeight + messageHeight + scanCardHeight;
        const totalGapSpace = availableHeight - totalContent;
        const equalSpacing = Math.max(0, totalGapSpace / 4); // Prevent negative
        
        // Set ONE spacing value used everywhere
        container.style.setProperty('--equal-spacing', `${equalSpacing}px`);
        container.style.setProperty('--padding-bottom', `${equalSpacing + safeAreaBottom}px`);
        
        console.log('[Spacing] Logged out:', {
          containerHeight,
          availableHeight,
          heroHeight,
          messageHeight,
          scanCardHeight,
          totalContent,
          totalGapSpace,
          equalSpacing,
          safeAreaBottom,
          computedSpacing: getComputedStyle(container).getPropertyValue('--equal-spacing')
        });
      } else {
        // 3 gaps needed: after header, after hero, padding-bottom
        // Content: hero + scan card (natural height)
        const totalContent = heroHeight + scanCardHeight;
        const totalGapSpace = availableHeight - totalContent;
        const equalSpacing = Math.max(0, totalGapSpace / 3); // Prevent negative
        
        // Set ONE spacing value used everywhere
        container.style.setProperty('--equal-spacing', `${equalSpacing}px`);
        container.style.setProperty('--padding-bottom', `${equalSpacing + safeAreaBottom}px`);
        
        console.log('[Spacing] Logged in:', {
          containerHeight,
          availableHeight,
          heroHeight,
          scanCardHeight,
          totalContent,
          totalGapSpace,
          equalSpacing,
          safeAreaBottom,
          computedSpacing: getComputedStyle(container).getPropertyValue('--equal-spacing')
        });
      }
    };

    // Calculate with multiple attempts
    const timeouts = [
      setTimeout(calculateEqualSpacing, 100),
      setTimeout(calculateEqualSpacing, 300),
      setTimeout(calculateEqualSpacing, 500),
    ];

    // ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(calculateEqualSpacing);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (heroRef.current) resizeObserver.observe(heroRef.current);
    if (messageRef.current) resizeObserver.observe(messageRef.current);
    if (scanCardRef.current) resizeObserver.observe(scanCardRef.current);

    // Window events
    const handleResize = () => setTimeout(calculateEqualSpacing, 200);
    const handleOrientationChange = () => setTimeout(calculateEqualSpacing, 400);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      timeouts.forEach(clearTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isLoggedOut, user]);

  useEffect(() => {
    // Initial check
    updateAuthState();

    // Listen to storage events to detect logout/login
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'consent_cop_user_session' || e.key === null) {
        updateAuthState();
      }
    };

    // Listen to custom logout events (for same-tab logout)
    const handleLogout = () => {
      updateAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-logout', handleLogout);
    window.addEventListener('user-login', handleLogout);

    // Also check on focus (in case of cross-tab logout)
    const handleFocus = () => {
      updateAuthState();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-logout', handleLogout);
      window.removeEventListener('user-login', handleLogout);
      window.removeEventListener('focus', handleFocus);
    };
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
    <div className="h-full w-full">
      {/* Mobile: Flexbox with CSS Custom Properties for perfect equal spacing */}
      {/* JavaScript calculates spacing, CSS variables control layout */}
      <div 
        ref={containerRef}
        className="h-[100dvh] flex flex-col max-w-5xl mx-auto px-4 sm:px-6 lg:px-4"
        style={{
          paddingBottom: 'var(--padding-bottom, 1rem)',
        }}
      >
        {/* Header spacer (4rem) */}
        <div className="h-16 flex-shrink-0"></div>
        
        {/* Hero Section */}
        <div 
          ref={heroRef} 
          className="text-center flex-shrink-0"
          style={{
            marginTop: 'var(--equal-spacing, 1rem)',
          }}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4 lg:mb-6 leading-tight">
            GDPR Compliance Testing
            <span className="block text-blue-600 mt-1 sm:mt-3 lg:mt-4">for Privacy Professionals</span>
          </h1>
          {/* Mobile: Shorter, punchier copy */}
          <p className="hidden sm:block text-sm lg:text-lg xl:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6 lg:mb-8">
            Automatically detect consent violations, track pre-consent pixel firing, and get AI-powered remediation advice. Built for DPOs, developers, and compliance teams.
          </p>
          <p className="sm:hidden text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Detect consent violations and get<br className="sm:hidden" /> AI-powered remediation advice.
          </p>
          
          {/* Value Props - Simplified for Mobile */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-4 lg:gap-6 mb-8 lg:mb-12">
            <div className="flex items-center space-x-2 text-sm lg:text-base text-slate-700">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Real-time Detection</span>
            </div>
            <div className="flex items-center space-x-2 text-sm lg:text-base text-slate-700">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-2 text-sm lg:text-base text-slate-700">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">GDPR Compliant</span>
            </div>
          </div>
        </div>

        {/* Login Message (only when logged out) */}
        {isLoggedOut && (
          <div 
            ref={messageRef} 
            className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-5 flex-shrink-0"
            style={{
              marginTop: 'var(--equal-spacing, 1rem)',
            }}
          >
            <p className="text-sm sm:text-base text-blue-800 flex items-start sm:items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Please sign in with Google to start scanning. Free tier includes 5 scans per week.</span>
              <span className="sm:hidden">Sign in to start scanning. 5 free scans per week.</span>
            </p>
          </div>
        )}

        {/* Upgrade Prompt (when logged in but scan limit reached) */}
        {!isLoggedOut && !scanCheck.allowed && (
          <div 
            ref={messageRef}
            style={{
              marginTop: 'var(--equal-spacing, 1rem)',
            }}
          >
            <UpgradePrompt
              tier={scanCheck.tier}
              reason={scanCheck.reason}
              scansRemaining={scanCheck.scansRemaining}
              onUpgrade={(tier) => {
                // TODO: Implement Stripe payment flow
                console.log('Upgrade to:', tier);
                alert(`Upgrade to ${tier} tier - Payment integration coming soon!`);
              }}
            />
          </div>
        )}

        {/* Scanner Card - Natural height, spacing calculated around it */}
        <div 
          ref={scanCardRef}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-8 lg:p-12 w-full flex-shrink-0"
          style={{
            marginTop: 'var(--equal-spacing, 1rem)',
          }}
        >
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 sm:gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading || !scanCheck.allowed}
            placeholder="https://example.com"
            className="block w-full pl-12 pr-4 py-4 sm:py-5 text-base sm:text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !scanCheck.allowed}
          className={`px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg whitespace-nowrap text-base sm:text-lg ${
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
        </div>
      </div>
    </div>
  );
};
