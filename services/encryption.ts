/**
 * Simple encryption utility for GDPR-compliant localStorage
 * Uses Web Crypto API for encryption (AES-GCM)
 * 
 * Note: This is client-side encryption. For maximum security,
 * sensitive data should be encrypted server-side. However, this
 * provides reasonable protection against casual inspection.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Generate a key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create encryption key
 * Uses a device-specific identifier for the password
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Use a combination of device characteristics as password
  // This ensures the key is device-specific but consistent
  const deviceId = localStorage.getItem('consent_cop_device_id') || 
                   crypto.randomUUID();
  localStorage.setItem('consent_cop_device_id', deviceId);
  
  // Use a fixed salt (in production, you might want to store this server-side)
  const salt = new TextEncoder().encode('consent-cop-salt-v1');
  
  return deriveKey(deviceId, salt);
}

/**
 * Encrypt sensitive data
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object (only encrypts specified sensitive fields)
 */
export async function encryptUserData(user: {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}): Promise<{
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}> {
  return {
    email: await encryptData(user.email),
    name: await encryptData(user.name),
    picture: user.picture ? await encryptData(user.picture) : undefined,
    given_name: user.given_name ? await encryptData(user.given_name) : undefined,
    family_name: user.family_name ? await encryptData(user.family_name) : undefined,
  };
}

/**
 * Decrypt user data
 */
export async function decryptUserData(encryptedUser: {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}): Promise<{
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}> {
  try {
    return {
      email: await decryptData(encryptedUser.email),
      name: await decryptData(encryptedUser.name),
      picture: encryptedUser.picture ? await decryptData(encryptedUser.picture) : undefined,
      given_name: encryptedUser.given_name ? await decryptData(encryptedUser.given_name) : undefined,
      family_name: encryptedUser.family_name ? await decryptData(encryptedUser.family_name) : undefined,
    };
  } catch (error) {
    // If decryption fails, try to read as plain text (backward compatibility)
    console.warn('Decryption failed, trying plain text fallback:', error);
    return encryptedUser;
  }
}


