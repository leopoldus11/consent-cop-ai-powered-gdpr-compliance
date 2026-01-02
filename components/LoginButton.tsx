/**
 * Login Button Component
 * Handles Google OAuth login flow
 */

import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { createUserSession, saveUserSession, type User } from '../services/auth';
import { registerUser } from '../services/googleSheets';

interface LoginButtonProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();
        
        const user: User = {
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
        };

        // Create user session
        const session = createUserSession(user, 5); // 5 initial credits
        await saveUserSession(session);

        // Register user with Google Sheets (if AppScript URL is configured)
        const appScriptUrl = import.meta.env.VITE_GOOGLE_APPSCRIPT_URL;
        if (appScriptUrl) {
          try {
            console.log('[Google Sheets] Attempting to register user...', { email: user.email, url: appScriptUrl });
            const result = await registerUser({
              email: user.email,
              name: user.name,
              given_name: user.given_name,
              family_name: user.family_name,
              initial_credits: 5,
            }, appScriptUrl);
            
            if (result.success) {
              console.log('[Google Sheets] User registered successfully', { isNewUser: result.isNewUser });
            } else {
              console.warn('[Google Sheets] Registration failed:', result.error);
            }
          } catch (error: any) {
            console.error('[Google Sheets] Registration error:', error);
            console.error('[Google Sheets] Error details:', {
              message: error.message,
              stack: error.stack,
              appScriptUrl: appScriptUrl ? 'configured' : 'missing'
            });
            // Don't block login if Sheets registration fails
          }
        } else {
          console.warn('[Google Sheets] VITE_GOOGLE_APPSCRIPT_URL not configured. User registration skipped.');
          console.info('[Google Sheets] To enable registration, add VITE_GOOGLE_APPSCRIPT_URL to your .env.local file');
        }

        onLoginSuccess(user);
      } catch (error: any) {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('OAuth error:', error);
      alert('Login failed. Please try again.');
      setIsLoading(false);
    },
  });

  return (
    <button
      onClick={() => handleGoogleLogin()}
      disabled={isLoading}
      className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-2 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 lg:h-4 lg:w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="hidden lg:inline">Signing in...</span>
          <span className="lg:hidden">...</span>
        </>
      ) : (
        <>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4 lg:w-4 lg:h-4" alt="Google" />
          <span className="hidden lg:inline">Sign in with Google</span>
          <span className="lg:hidden">Sign in</span>
        </>
      )}
    </button>
  );
};


