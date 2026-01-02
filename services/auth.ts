/**
 * Authentication Service
 * Handles Google OAuth and user session management
 * GDPR-compliant: Encrypts personal data before storing in localStorage
 */

import { encryptUserData, decryptUserData } from './encryption';

export interface User {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface UserSession {
  user: User;
  scanCount: number;
  lastScanDate: string | null;
  weeklyResetDate: string;
  initialCredits: number;
}

// Internal encrypted session structure
interface EncryptedUserSession {
  user: {
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
  };
  scanCount: number;
  lastScanDate: string | null;
  weeklyResetDate: string;
  initialCredits: number;
}

const WEEKLY_SCAN_LIMIT = 5;
const STORAGE_KEY = 'consent_cop_user_session';

/**
 * Get current user session from localStorage (decrypts personal data)
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const encryptedSession: EncryptedUserSession = JSON.parse(stored);
    
    // Decrypt user data
    const decryptedUser = await decryptUserData(encryptedSession.user);
    
    const session: UserSession = {
      ...encryptedSession,
      user: decryptedUser,
    };
    
    // Check if weekly reset is needed
    const resetDate = new Date(session.weeklyResetDate);
    const now = new Date();
    
    if (now > resetDate) {
      // Reset scan count
      session.scanCount = 0;
      session.weeklyResetDate = getNextWeekResetDate();
      await saveUserSession(session);
    }
    
    return session;
  } catch (error) {
    console.error('Error reading user session:', error);
    return null;
  }
}

/**
 * Save user session to localStorage (encrypts personal data)
 */
export async function saveUserSession(session: UserSession): Promise<void> {
  try {
    // Encrypt user data before storing
    const encryptedUser = await encryptUserData(session.user);
    
    const encryptedSession: EncryptedUserSession = {
      ...session,
      user: encryptedUser,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedSession));
    // Dispatch custom event to notify components of login
    window.dispatchEvent(new Event('user-login'));
  } catch (error) {
    console.error('Error saving user session:', error);
  }
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Dispatch custom event to notify components of logout
  window.dispatchEvent(new Event('user-logout'));
}

/**
 * Check if user can perform a scan
 * Note: This is synchronous for UI responsiveness, but may return stale data
 * For accurate checks, use getUserSession() directly
 */
export function canUserScan(): { allowed: boolean; reason?: string; scansRemaining: number } {
  // For synchronous checks, we'll use a cached version
  // The actual session is async now due to decryption
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { allowed: false, reason: 'Please sign in to use Consent Cop', scansRemaining: 0 };
    }
    
    const session: EncryptedUserSession = JSON.parse(stored);
    
    if (session.scanCount >= WEEKLY_SCAN_LIMIT) {
      const resetDate = new Date(session.weeklyResetDate);
      const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        allowed: false,
        reason: `Weekly scan limit reached. Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}`,
        scansRemaining: 0
      };
    }
    
    return {
      allowed: true,
      scansRemaining: WEEKLY_SCAN_LIMIT - session.scanCount
    };
  } catch (error) {
    return { allowed: false, reason: 'Please sign in to use Consent Cop', scansRemaining: 0 };
  }
}

/**
 * Increment scan count after successful scan
 */
export async function incrementScanCount(): Promise<void> {
  const session = await getUserSession();
  if (!session) return;
  
  session.scanCount += 1;
  session.lastScanDate = new Date().toISOString();
  await saveUserSession(session);
}

/**
 * Get next weekly reset date (next Monday at midnight)
 */
function getNextWeekResetDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  
  const resetDate = new Date(now);
  resetDate.setDate(now.getDate() + daysUntilMonday);
  resetDate.setHours(0, 0, 0, 0);
  
  return resetDate.toISOString();
}

/**
 * Create new user session from Google OAuth response
 */
export function createUserSession(user: User, initialCredits: number = WEEKLY_SCAN_LIMIT): UserSession {
  return {
    user,
    scanCount: 0,
    lastScanDate: null,
    weeklyResetDate: getNextWeekResetDate(),
    initialCredits
  };
}


