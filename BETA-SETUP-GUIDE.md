# Beta v0.9.5 Setup Guide

## 🔐 Required Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth (Required for authentication)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# Google AppScript (Optional - for user registration tracking)
VITE_GOOGLE_APPSCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Existing variables
VITE_API_KEY=your_gemini_api_key
VITE_USE_REAL_SCANNER=true
VITE_API_URL=http://localhost:3001
```

---

## 📋 Setup Steps

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** (or **Google Identity Services**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
7. Authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
8. Copy the **Client ID** to `.env.local` as `VITE_GOOGLE_CLIENT_ID`

### 2. Google Sheets Setup (Optional)

1. Create a new Google Sheet
2. Add headers in Row 1:
   - `timestamp` | `email` | `name` | `initial_credits` | `browser_info` | `location_hint`
3. Go to **Extensions** → **Apps Script**
4. Paste the AppScript code from `GOOGLE-APPSCRIPT-CODE.md`
5. Deploy as **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web app URL** to `.env.local` as `VITE_GOOGLE_APPSCRIPT_URL`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

---

## ✅ Verification Checklist

- [ ] Google OAuth Client ID configured
- [ ] User can sign in with Google
- [ ] User session persists after refresh
- [ ] Scan limit (5/week) is enforced
- [ ] Google Sheets registration works (if configured)
- [ ] PDF export works
- [ ] Mobile responsive design
- [ ] Footer links work (Imprint, Privacy)

---

## 🚀 Deployment Notes

### For Production:

1. **Update OAuth redirect URIs** in Google Cloud Console
2. **Set production environment variables** in hosting platform
3. **Enable CORS** for your domain
4. **Set up backend API** (if using real scanner)
5. **Configure rate limiting** (if needed)

### Recommended Platforms:

- **Vercel**: Easy deployment, good for Next.js/Vite
- **Netlify**: Great for static sites
- **Railway/Render**: Good for full-stack (frontend + backend)

---

## 📝 Next Steps

1. Answer design interview questions (see `DESIGN-INTERVIEW.md`)
2. Implement Request Lifecycle redesign
3. Add scan history view
4. Final design polish
5. Deploy!


