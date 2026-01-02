/**
 * Auth Provider Component
 * Wraps app with Google OAuth provider
 */

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get Google OAuth Client ID from environment
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID not set. OAuth will not work.');
    // Still render children for development
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};


