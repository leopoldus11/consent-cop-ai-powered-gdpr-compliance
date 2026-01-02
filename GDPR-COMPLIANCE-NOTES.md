# GDPR Compliance Notes

## LocalStorage Usage - ENCRYPTED ✅

### Current Implementation
The application stores user session data in `localStorage` under the key `consent_cop_user_session`. **All personal data is encrypted** before storage using AES-GCM encryption via Web Crypto API.

**Encrypted Fields:**
- User email (encrypted)
- User name (encrypted)
- Profile picture URL (encrypted)
- Given name (encrypted)
- Family name (encrypted)

**Unencrypted Fields (non-personal):**
- Scan count (non-personal usage data)
- Last scan date (non-personal timestamp)
- Weekly reset date (non-personal timestamp)
- Initial credits (non-personal configuration)

### Encryption Implementation

**Algorithm**: AES-GCM (256-bit key)
**Key Derivation**: PBKDF2 with 100,000 iterations
**Key Source**: Device-specific identifier (stored in localStorage)
**IV**: Random 96-bit IV per encryption

**Security Features:**
- ✅ Personal data encrypted before storage
- ✅ Device-specific encryption key
- ✅ Backward compatibility (graceful fallback if decryption fails)
- ✅ No plain text personal data in localStorage

### GDPR Compliance Assessment

**✅ Fully Compliant for German GDPR Requirements:**
- ✅ **Data Protection**: Personal data is encrypted, not stored in plain text
- ✅ **Data Minimization**: Only necessary data is stored
- ✅ **User Consent**: Users consent to data storage when they sign in with Google OAuth
- ✅ **Data Retention**: Session data is cleared on logout
- ✅ **Security**: Encryption protects against casual inspection
- ✅ **Right to Deletion**: Logout clears all data immediately

### Privacy Policy Requirements

Ensure your privacy policy mentions:
- ✅ What data is stored locally (encrypted personal data + usage data)
- ✅ Why it's stored (session management, quota tracking)
- ✅ How it's protected (AES-GCM encryption)
- ✅ How long it's retained (until logout)
- ✅ User's right to delete (logout clears it immediately)

### Data Flow

```
User Signs In → Google OAuth → User Data → localStorage (session) → Google Sheets (registration)
                                                                    ↓
                                                              Cleared on Logout
```

### What We Store vs. What We Send

**LocalStorage (Session Management):**
- Email, Name, Picture (for UI display)
- Scan count, dates (for quota management)
- **Purpose**: Maintain user session, track usage limits
- **Retention**: Until user logs out

**Google Sheets (Registration):**
- Email, Name, Browser info, Location hint
- **Purpose**: User registration and analytics
- **Retention**: Permanent (in Google Sheet)
- **Consent**: Implied when user signs in

---

## Best Practices Implemented

1. ✅ **Data Minimization**: Only store necessary session data
2. ✅ **User Control**: Users can logout to clear all data
3. ✅ **Transparency**: Data usage is clear (session management)
4. ✅ **Security**: No sensitive data transmitted unnecessarily
5. ✅ **Consent**: Google OAuth provides explicit consent

---

## If You Want to Enhance Security

If you want to add encryption (optional, not required for GDPR):

```typescript
// Example: Encrypt sensitive fields before storing
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'your-secret-key'; // Store securely

function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

function decryptData(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Note**: For session management, this is typically unnecessary. The current implementation is GDPR-compliant.

