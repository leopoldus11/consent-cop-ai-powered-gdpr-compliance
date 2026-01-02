# Real Scanner Setup Guide

## 🎉 Real Scanner Implementation Complete!

The real scanner is now implemented with:
- ✅ Puppeteer browser automation
- ✅ Real network request interception
- ✅ Actual CMP detection (Usercentrics, OneTrust, Cookiebot, etc.)
- ✅ Actual TMS detection (Adobe, GTM, Tealium, etc.)
- ✅ Real screenshot capture (before/after consent)
- ✅ Proper compliance scoring algorithm
- ✅ Realistic GDPR fine estimation

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `puppeteer` - Browser automation
- `express` - API server
- `cors` - CORS middleware
- `concurrently` - Run client & server together
- `tsx` - TypeScript execution

### Step 2: Set Up Environment Variables

Create/update `.env.local`:

```env
# Gemini AI (required)
VITE_API_KEY=your_gemini_api_key_here

# Real Scanner (optional - defaults to mock)
VITE_USE_REAL_SCANNER=true
VITE_API_URL=http://localhost:3001
```

### Step 3: Start Development Servers

The app now runs **two servers**:
1. **Frontend** (Vite) - Port 3000
2. **Backend API** (Express) - Port 3001

Start both with:
```bash
npm run dev
```

Or start separately:
```bash
# Terminal 1: Frontend
npm run dev:client

# Terminal 2: Backend API
npm run dev:server
```

### Step 4: Test Real Scanning

1. Open http://localhost:3000
2. Enter a URL (e.g., `https://dertour.de`)
3. Click "Run Compliance Check"
4. Wait for real scan (may take 10-30 seconds)
5. See actual results with real screenshots!

---

## 📋 How It Works

### Architecture

```
Frontend (React)          Backend API (Express)         Browser (Puppeteer)
     |                            |                            |
     |-- POST /api/scan --------->|                            |
     |                            |-- Launch Puppeteer ------->|
     |                            |                            |-- Navigate to URL
     |                            |                            |-- Intercept requests
     |                            |                            |-- Capture screenshot
     |                            |                            |-- Click consent banner
     |                            |                            |-- Capture screenshot
     |                            |                            |-- Detect CMP/TMS
     |                            |<-- Scan results -----------|
     |<-- JSON response ----------|                            |
     |                            |                            |
```

### What the Real Scanner Does

1. **Opens Website**: Uses Puppeteer to open the URL in headless Chrome
2. **Intercepts Requests**: Captures all network requests (before consent)
3. **Captures Screenshot**: Takes screenshot of page before consent
4. **Detects CMP**: Looks for consent banners (Usercentrics, OneTrust, etc.)
5. **Clicks Consent**: Automatically clicks "Accept All" if banner found
6. **Captures Screenshot**: Takes screenshot after consent
7. **Intercepts Requests**: Captures requests after consent
8. **Detects TMS**: Identifies tag management systems (Adobe, GTM, etc.)
9. **Analyzes Violations**: Compares before/after to find pre-consent tracking
10. **Calculates Score**: Uses real algorithm based on violations
11. **Returns Results**: Sends complete scan data to frontend

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_KEY` | Gemini AI API key | Required |
| `VITE_USE_REAL_SCANNER` | Enable real scanner | `false` (uses mock) |
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |
| `PORT` | Backend server port | `3001` |

### Switching Between Mock and Real

**Use Mock Scanner** (default):
```env
# Don't set VITE_USE_REAL_SCANNER, or set to false
VITE_USE_REAL_SCANNER=false
```

**Use Real Scanner**:
```env
VITE_USE_REAL_SCANNER=true
VITE_API_URL=http://localhost:3001
```

---

## 🎯 Features

### CMP Detection

Detects these Consent Management Platforms:
- ✅ Usercentrics
- ✅ OneTrust
- ✅ Cookiebot
- ✅ Quantcast Choice
- ✅ TrustArc
- ✅ Didomi
- ✅ Generic consent banners

### TMS Detection

Detects these Tag Management Systems:
- ✅ Adobe Experience Platform
- ✅ Google Tag Manager
- ✅ Tealium
- ✅ Segment
- ✅ Adobe Launch
- ✅ Ensighten

### Compliance Scoring

Real algorithm considers:
- Number of violations
- Type of data collected (PII vs. non-PII)
- Volume of data
- CMP presence
- Request timing (before/after consent)

### GDPR Fine Estimation

Improved calculation based on:
- Risk score
- Number of violations
- PII collection
- Violation severity

---

## 🐛 Troubleshooting

### "Scan failed: Network error"

**Problem**: Backend API server not running

**Solution**:
```bash
# Make sure backend is running
npm run dev:server

# Or check if port 3001 is available
lsof -i :3001
```

### "Puppeteer browser not found"

**Problem**: Puppeteer needs to download Chromium

**Solution**:
```bash
# Reinstall Puppeteer
npm install puppeteer --force
```

### "Scan takes too long"

**Problem**: Some websites are slow to load

**Solution**: 
- This is normal for real scans (10-30 seconds)
- The scanner waits for network idle
- Complex sites may take longer

### "Consent banner not detected"

**Problem**: CMP detection may not find all banners

**Solution**:
- The scanner tries multiple selectors
- Some custom CMPs may not be detected
- Check the "CMP: UNKNOWN" badge if no CMP found

### Screenshots are blank

**Problem**: Some sites block screenshots or use iframes

**Solution**:
- This is a limitation of headless browsers
- Some sites detect automation and block
- Try a different URL to test

---

## 📊 Performance

### Scan Times

- **Simple sites**: 5-10 seconds
- **Medium sites**: 10-20 seconds
- **Complex sites**: 20-30+ seconds

### Resource Usage

- **Memory**: ~200-500MB per scan
- **CPU**: Moderate during scan
- **Network**: Depends on site complexity

---

## 🚢 Production Deployment

### Option 1: Separate Servers

**Frontend** (Vite build):
```bash
npm run build
# Deploy dist/ to Vercel, Netlify, etc.
```

**Backend** (Express server):
```bash
# Deploy to Railway, Render, Heroku, etc.
npm run server
```

Set environment variables:
- `VITE_API_URL=https://your-api-domain.com`
- `VITE_USE_REAL_SCANNER=true`

### Option 2: Serverless Functions

Convert `server/scanner.ts` to serverless:
- Vercel Serverless Functions
- Netlify Functions
- AWS Lambda
- Google Cloud Functions

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "server"]
```

---

## 🔒 Security Considerations

1. **API Key Protection**: Backend API keeps Gemini key server-side
2. **Rate Limiting**: Add rate limiting to `/api/scan` endpoint
3. **Input Validation**: Validate URLs before scanning
4. **Timeout**: Set reasonable timeouts (30s default)
5. **Error Handling**: Don't expose internal errors to clients

---

## 📝 Next Steps

1. **Add Rate Limiting**: Prevent abuse
2. **Add Caching**: Cache scan results
3. **Improve CMP Detection**: Add more CMP patterns
4. **Add More TMS**: Support more tag managers
5. **Error Recovery**: Better error handling
6. **Progress Updates**: WebSocket for real-time progress
7. **Scan History**: Store scan results
8. **PDF Reports**: Generate downloadable reports

---

## ✅ Status

- ✅ Real browser automation (Puppeteer)
- ✅ Network request interception
- ✅ CMP detection
- ✅ TMS detection
- ✅ Real screenshot capture
- ✅ Compliance scoring
- ✅ GDPR fine estimation
- ✅ Frontend integration
- ✅ Error handling

**Ready for testing!** 🎉

---

**Last Updated**: Real scanner implementation complete


