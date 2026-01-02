# Real Scanner Implementation Plan

## Architecture Decision

Since Puppeteer requires Node.js and cannot run in the browser, we need a **backend API** to handle browser automation. 

**Options:**
1. **Separate Express/Node server** (Recommended for production)
2. **Vite server middleware** (Good for development)
3. **Serverless function** (Vercel, Netlify, etc.)

For now, we'll implement a **hybrid approach**:
- Backend API route for Puppeteer scanning
- Frontend calls the API
- Can be deployed as serverless or standalone server

---

## Implementation Steps

### 1. Install Dependencies

```bash
npm install puppeteer express cors
npm install -D @types/express @types/cors
```

### 2. Create Backend API Server

Create `server/` directory with:
- `server.ts` - Express server
- `scanner.ts` - Real Puppeteer scanner
- `detectors.ts` - CMP/TMS detection logic

### 3. Update Frontend

- Update `App.tsx` to call API instead of mock
- Add loading states for longer scan times
- Handle errors gracefully

### 4. Features to Implement

#### Real Scanner (`scanner.ts`)
- ✅ Open website in headless browser
- ✅ Intercept network requests
- ✅ Capture screenshot before consent
- ✅ Detect and click consent banner
- ✅ Capture screenshot after consent
- ✅ Compare requests (before vs after)
- ✅ Detect CMP (Usercentrics, OneTrust, Cookiebot, etc.)
- ✅ Detect TMS (Adobe, GTM, Tealium, etc.)
- ✅ Classify requests (violation vs allowed)

#### CMP Detection (`detectors.ts`)
- Usercentrics: Look for `usercentrics.com`, `UC_UI` global
- OneTrust: Look for `onetrust.com`, `OneTrust` global
- Cookiebot: Look for `cookiebot.com`, `Cookiebot` global
- Quantcast: Look for `quantcast.com`, `__tcfapi` global
- Custom: Detect common patterns

#### TMS Detection (`detectors.ts`)
- Adobe Experience Platform: `adobe.com`, `omtrdc.net`, `adobeDataLayer`
- Google Tag Manager: `googletagmanager.com`, `dataLayer`
- Tealium: `tealiumiq.com`, `utag` global
- Segment: `segment.io`, `analytics` global

#### Compliance Scoring (`scoring.ts`)
- Analyze request timing (before/after consent)
- Classify data types (PII, behavioral, etc.)
- Calculate risk score based on:
  - Number of pre-consent requests
  - Type of data collected
  - Volume of data
  - Severity of violations

---

## File Structure

```
consent-cop---ai-powered-gdpr-compliance/
├── server/
│   ├── server.ts          # Express API server
│   ├── scanner.ts         # Puppeteer scanner
│   ├── detectors.ts       # CMP/TMS detection
│   ├── scoring.ts         # Compliance scoring
│   └── types.ts           # Server-side types
├── services/
│   ├── realScanner.ts     # Frontend API client
│   └── gemini.ts          # (existing)
└── ...
```

---

## API Endpoints

### POST /api/scan

**Request:**
```json
{
  "url": "https://dertour.de"
}
```

**Response:**
```json
{
  "id": "scan_123",
  "url": "https://dertour.de",
  "timestamp": "2024-01-15T10:30:00Z",
  "riskScore": 75,
  "violationsCount": 2,
  "compliantCount": 1,
  "consentBannerDetected": true,
  "bannerProvider": "Usercentrics",
  "requests": [...],
  "screenshots": {
    "before": "data:image/png;base64,...",
    "after": "data:image/png;base64,..."
  },
  "dataLayers": ["adobeDataLayer"],
  "tmsDetected": ["Adobe Experience Platform"]
}
```

---

## Next Steps

1. Install dependencies
2. Create server structure
3. Implement Puppeteer scanner
4. Add CMP/TMS detection
5. Implement real scoring
6. Update frontend to use API
7. Test with real websites

---

**Status**: Implementation in progress


