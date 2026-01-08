/**
 * Google Sheets Integration Service
 * Sends user registration data to Google AppScript endpoint
 */

export interface UserRegistrationData {
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  initial_credits: number;
  browser_info: string;
  location_hint: string;
  referrer?: string;
  session_id?: string;
}

/**
 * Get browser information
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' :
                  ua.includes('Firefox') ? 'Firefox' :
                  ua.includes('Safari') ? 'Safari' :
                  ua.includes('Edge') ? 'Edge' : 'Unknown';
  
  const platform = navigator.platform;
  return `${browser} on ${platform}`;
}

/**
 * Get location hint (timezone-based)
 */
function getLocationHint(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

/**
 * Register user with Google Sheets via AppScript
 */
export async function registerUser(
  userData: Omit<UserRegistrationData, 'browser_info' | 'location_hint' | 'timestamp'>,
  appScriptUrl: string
): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
  try {
    const registrationData: UserRegistrationData = {
      ...userData,
      browser_info: getBrowserInfo(),
      location_hint: getLocationHint(),
      referrer: document.referrer || 'direct',
      session_id: crypto.randomUUID(),
    };

    const params = new URLSearchParams({
      timestamp: new Date().toISOString(),
      email: registrationData.email,
      name: registrationData.name,
      initial_credits: registrationData.initial_credits.toString(),
      browser_info: registrationData.browser_info,
      location_hint: registrationData.location_hint,
      ...(registrationData.given_name && { given_name: registrationData.given_name }),
      ...(registrationData.family_name && { family_name: registrationData.family_name }),
      ...(registrationData.referrer && { referrer: registrationData.referrer }),
      ...(registrationData.session_id && { session_id: registrationData.session_id }),
    });

    const response = await fetch(`${appScriptUrl}?${params.toString()}`, {
      method: 'GET', // AppScript handles both GET and POST
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success || false,
      isNewUser: result.isNewUser || false,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    return {
      success: false,
      isNewUser: false,
      error: error.message || 'Failed to register user',
    };
  }
}



