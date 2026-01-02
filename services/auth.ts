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

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'byok';

export interface UserSession {
  user: User;
  scanCount: number;
  lastScanDate: string | null;
  weeklyResetDate: string;
  initialCredits: number;
  subscriptionTier: SubscriptionTier;
  monthlyScanLimit?: number; // For paid tiers
  monthlyResetDate?: string; // For paid tiers
  customApiKey?: string; // Encrypted for BYOK users
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
  subscriptionTier: SubscriptionTier;
  monthlyScanLimit?: number;
  monthlyResetDate?: string;
  customApiKey?: string; // Encrypted
}

const WEEKLY_SCAN_LIMIT = 5;
const STORAGE_KEY = 'consent_cop_user_session';

// Subscription tier limits
const TIER_LIMITS: Record<SubscriptionTier, { weekly?: number; monthly?: number }> = {
  free: { weekly: 5 },
  starter: { monthly: 50 },
  pro: { monthly: 200 },
  enterprise: { monthly: Infinity },
  byok: { monthly: Infinity }, // Unlimited (subject to Google's limits)
};

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
    
    // Decrypt custom API key if present (for BYOK)
    let decryptedApiKey = encryptedSession.customApiKey;
    if (encryptedSession.customApiKey && encryptedSession.subscriptionTier === 'byok') {
      try {
        const decrypted = await decryptUserData({ apiKey: encryptedSession.customApiKey } as any);
        decryptedApiKey = (decrypted as any).apiKey || encryptedSession.customApiKey;
      } catch (error) {
        console.error('Error decrypting API key:', error);
      }
    }
    
    const session: UserSession = {
      ...encryptedSession,
      user: decryptedUser,
      customApiKey: decryptedApiKey,
    };
    
    // Check if reset is needed based on tier
    const now = new Date();
    
    if (session.subscriptionTier === 'free') {
      // Weekly reset for free tier
      const resetDate = new Date(session.weeklyResetDate);
      if (now > resetDate) {
        session.scanCount = 0;
        session.weeklyResetDate = getNextWeekResetDate();
        await saveUserSession(session);
      }
    } else if (session.subscriptionTier !== 'byok' && session.subscriptionTier !== 'enterprise') {
      // Monthly reset for paid tiers
      if (session.monthlyResetDate) {
        const resetDate = new Date(session.monthlyResetDate);
        if (now > resetDate) {
          session.scanCount = 0;
          session.monthlyResetDate = getNextMonthResetDate();
          await saveUserSession(session);
        }
      }
    }
    // BYOK and Enterprise have unlimited scans, no reset needed
    
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
export function canUserScan(): { allowed: boolean; reason?: string; scansRemaining: number; tier: SubscriptionTier } {
  // For synchronous checks, we'll use a cached version
  // The actual session is async now due to decryption
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { allowed: false, reason: 'Please sign in to use Consent Cop', scansRemaining: 0, tier: 'free' };
    }
    
    const session: EncryptedUserSession = JSON.parse(stored);
    const tier = session.subscriptionTier || 'free';
    const limits = TIER_LIMITS[tier];
    
    // BYOK and Enterprise have unlimited scans
    if (tier === 'byok' || tier === 'enterprise') {
      return { allowed: true, scansRemaining: Infinity, tier };
    }
    
    // Check limits based on tier
    if (tier === 'free') {
      if (session.scanCount >= (limits.weekly || WEEKLY_SCAN_LIMIT)) {
        const resetDate = new Date(session.weeklyResetDate);
        const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          allowed: false,
          reason: `Weekly scan limit reached. Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}`,
          scansRemaining: 0,
          tier
        };
      }
      return {
        allowed: true,
        scansRemaining: (limits.weekly || WEEKLY_SCAN_LIMIT) - session.scanCount,
        tier
      };
    } else {
      // Paid tiers (monthly limits)
      const monthlyLimit = session.monthlyScanLimit || limits.monthly || 0;
      if (session.scanCount >= monthlyLimit) {
        const resetDate = session.monthlyResetDate ? new Date(session.monthlyResetDate) : null;
        if (resetDate) {
          const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            allowed: false,
            reason: `Monthly scan limit reached. Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}`,
            scansRemaining: 0,
            tier
          };
        }
      }
      return {
        allowed: true,
        scansRemaining: monthlyLimit - session.scanCount,
        tier
      };
    }
  } catch (error) {
    return { allowed: false, reason: 'Please sign in to use Consent Cop', scansRemaining: 0, tier: 'free' };
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
 * Get next monthly reset date (same day next month)
 */
function getNextMonthResetDate(): string {
  const now = new Date();
  const resetDate = new Date(now);
  resetDate.setMonth(now.getMonth() + 1);
  resetDate.setHours(0, 0, 0, 0);
  return resetDate.toISOString();
}

/**
 * Create new user session from Google OAuth response
 */
export function createUserSession(
  user: User, 
  initialCredits: number = WEEKLY_SCAN_LIMIT,
  tier: SubscriptionTier = 'free'
): UserSession {
  const limits = TIER_LIMITS[tier];
  const session: UserSession = {
    user,
    scanCount: 0,
    lastScanDate: null,
    weeklyResetDate: getNextWeekResetDate(),
    initialCredits,
    subscriptionTier: tier,
  };
  
  if (tier !== 'free' && tier !== 'byok' && tier !== 'enterprise') {
    session.monthlyScanLimit = limits.monthly;
    session.monthlyResetDate = getNextMonthResetDate();
  }
  
  return session;
}

/**
 * Set user's custom API key (for BYOK tier)
 */
export async function setCustomApiKey(apiKey: string): Promise<void> {
  const session = await getUserSession();
  if (!session) throw new Error('User not logged in');
  
  // Encrypt the API key before storing
  const encryptedKey = await encryptUserData({ apiKey } as any);
  session.customApiKey = (encryptedKey as any).apiKey || encryptedKey;
  session.subscriptionTier = 'byok';
  await saveUserSession(session);
}

/**
 * Get user's custom API key (for BYOK tier)
 */
export async function getCustomApiKey(): Promise<string | null> {
  const session = await getUserSession();
  if (!session || !session.customApiKey) return null;
  
  try {
    // Decrypt the API key
    const decrypted = await decryptUserData({ apiKey: session.customApiKey } as any);
    return (decrypted as any).apiKey || session.customApiKey;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return null;
  }
}


