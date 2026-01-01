# Technical Breakdown & Implementation Guide

This document provides a comprehensive technical breakdown of the Consent Cop application based on the Google AI Studio analysis and implementation details.

## 🏗️ Architecture Overview

### Project Structure
- **Framework**: Vite + React 19 + TypeScript
- **AI Integration**: Google Gemini 3 Pro via `@google/genai` SDK
- **Styling**: Tailwind CSS (via CDN)
- **Build System**: Vite 6 with React plugin

### Key Architectural Decisions

1. **Client-Side AI Execution**: All Gemini AI calls are currently client-side
   - **Rationale**: Simplified development and testing
   - **Production Consideration**: Should move to backend API routes for production

2. **Dynamic API Key Loading**: GoogleGenAI client initialized inside functions
   - **Rationale**: Ensures latest API key is always used (supports BYOK scenarios)
   - **Implementation**: `getApiKey()` helper function with fallback support

3. **Structured Output**: Uses JSON Schema validation for AI responses
   - **Rationale**: Prevents AI "hallucination" and ensures consistent data structure
   - **Implementation**: `responseMimeType: "application/json"` with `responseSchema`

---

## 🤖 Gemini AI Integration Points

### 1. Executive Audit Summary (`analyzeScanResult`)

**Location**: `services/gemini.ts`

**Purpose**: Transforms raw scan results into business-ready executive summaries with legal context.

**Input**:
```typescript
{
  url: string;
  violationsCount: number;
  requests: RequestLog[];
  tmsDetected: string[];
  bannerProvider?: string;
}
```

**Output**:
```typescript
{
  summary: string;                    // Executive summary
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  remediationSteps: Array<{
    title: string;
    description: string;
    priority: 'Immediate' | 'Next' | 'Soon';
  }>;
  legalContext: string;                // GDPR article references
  disclaimer: string;                  // Legal liability protection
}
```

**Model**: `gemini-3-pro-preview`

**Trigger**: Automatically after scan completes (in `App.tsx`)

**Display**: `components/AiAdvisor.tsx`

---

### 2. Forensic Beacon Deobfuscation (`getDeepBeaconAnalysis`)

**Location**: `services/gemini.ts`

**Purpose**: Analyzes obfuscated tracking parameters to identify PII exfiltration.

**Input**:
- `domain: string` - The tracking domain
- `params: Record<string, string>` - URL query parameters or POST data

**Output**:
```typescript
{
  classification: string;              // Tracker type (Analytics, Advertising, etc.)
  dataExfiltration: string;            // What PII/identifiers are being sent
  forensicEvidence: string;            // Why this violates "Privacy by Default"
  remediation: string;                 // Technical fix for developers
}
```

**Model**: `gemini-3-pro-preview`

**Trigger**: User clicks "Run Forensic Audit" button in violation modal

**Display**: `components/ViolationList.tsx` (modal)

**UI Flow**:
1. User clicks "Deep Inspect" on a violation
2. Modal opens showing raw parameters
3. User clicks "Run Forensic Audit" button
4. AI analysis appears with forensic breakdown

---

### 3. Structured Remediation Plan

**Location**: `components/AiAdvisor.tsx`

**Purpose**: Displays prioritized 3-step action plan from AI analysis.

**Features**:
- Color-coded severity badges
- Priority indicators (Immediate, Next, Soon)
- Legal context highlighting
- Professional disclaimer footer

---

## 🔧 Environment Variable Configuration

### Supported Approaches

The application supports **two environment variable naming conventions**:

#### Option 1: Vite-Native (Recommended)
```env
VITE_API_KEY=your_gemini_api_key_here
```
- Accessed via: `import.meta.env.VITE_API_KEY`
- Standard Vite approach
- Variables prefixed with `VITE_` are exposed to client

#### Option 2: Legacy/Define-Based
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
- Mapped via `vite.config.ts` define option
- Accessible as `process.env.API_KEY` in code
- Maintained for backward compatibility

### Implementation

The `getApiKey()` helper function in `services/gemini.ts`:
1. First tries `import.meta.env.VITE_API_KEY` (Vite-native)
2. Falls back to `process.env.API_KEY` (define-based)
3. Throws descriptive error if neither is found

### Vite Configuration

```typescript
// vite.config.ts
const apiKey = env.VITE_API_KEY || env.GEMINI_API_KEY;
define: {
  'process.env.API_KEY': JSON.stringify(apiKey),
  'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
}
```

---

## 📊 Data Flow

### Scan → AI Analysis Flow

```
User enters URL
    ↓
Scanner triggers mockScan() [or real Puppeteer in production]
    ↓
ScanResult created with:
  - Violation count
  - Request logs
  - Detected technologies
  - Screenshots
    ↓
analyzeScanResult() called automatically
    ↓
Gemini 3 Pro generates:
  - Executive summary
  - Severity assessment
  - Remediation steps
  - Legal context
    ↓
AIAnalysis state updated
    ↓
AiAdvisor component displays results
```

### Deep Inspect Flow

```
User clicks "Deep Inspect" on violation
    ↓
Modal opens with raw parameters
    ↓
User clicks "Run Forensic Audit"
    ↓
getDeepBeaconAnalysis() called with domain + params
    ↓
Gemini 3 Pro analyzes:
  - Tracker classification
  - Data exfiltration details
  - Forensic evidence
  - Technical remediation
    ↓
BeaconAnalysis displayed in modal
```

---

## 🛡️ Error Handling & JSON Parsing

### Markdown Wrapping Issue

Sometimes Gemini returns JSON wrapped in markdown code blocks:
```markdown
```json
{ "summary": "..." }
```
```

### Solution

The `extractJSON()` helper function:
1. Detects markdown code blocks with regex
2. Extracts JSON content
3. Falls back to raw text if no markdown detected

### Error Handling

Both AI functions include try-catch blocks that:
- Log errors to console
- Display raw response for debugging
- Throw user-friendly error messages

---

## 🎨 UI Components

### Key Components

1. **Scanner** (`components/Scanner.tsx`)
   - URL input field
   - Scan trigger button
   - Loading states

2. **AiAdvisor** (`components/AiAdvisor.tsx`)
   - Executive summary display
   - Severity badge
   - Remediation action plan
   - Legal context box
   - Disclaimer footer

3. **ViolationList** (`components/ViolationList.tsx`)
   - Violation table
   - "Deep Inspect" buttons
   - Forensic analysis modal
   - "Run Forensic Audit" trigger

4. **Timeline** (`components/Timeline.tsx`)
   - Request timeline visualization
   - Chronological ordering

5. **RiskAssessment** (`components/RiskAssessment.tsx`)
   - Risk score display
   - Grade calculation (A-F)
   - Estimated fine range

---

## 🔐 Security Considerations

### Current State (Development)

- **API Key Exposure**: Currently exposed to client-side code
- **Risk**: API key visible in browser DevTools → Network tab
- **Mitigation**: For production, move AI calls to backend

### Production Recommendations

1. **Backend API Route**
   - Move Gemini calls to server-side
   - Protect API key from client exposure
   - Implement rate limiting
   - Add request authentication

2. **API Key Management**
   - Use environment variables in hosting platform
   - Never commit `.env.local` to git
   - Rotate keys regularly
   - Use separate keys for dev/staging/prod

3. **Rate Limiting**
   - Implement client-side localStorage counter
   - Limit free scans to 5 per day per user
   - Add server-side rate limiting for production

---

## 🌍 German Compliance (Impressum)

### Legal Requirements

For German deployment, the `ImpressumPage` component must include:
- Company name and legal form (GmbH, etc.)
- Registered address
- Contact information
- VAT ID (Umsatzsteuer-ID)
- Managing director information
- Commercial register details

### Current Status

**⚠️ Placeholder Data Present**: The `ImpressumPage` currently contains placeholder values:
- VAT ID: `DE123456789` (needs real value)
- Company details: Need to be updated with actual business information

### Action Required

Before going live in Germany:
1. Update `components/InformationPages.tsx`
2. Replace all placeholder values with actual business details
3. Ensure compliance with German legal structure requirements
4. Review with legal counsel if needed

---

## 🧪 Testing & Development

### Mock Scanner

Currently uses `services/mockScanner.ts` for development:
- Simulates network interception
- Provides sample violation data
- Returns mock screenshots
- 2-second delay to simulate real scan

### Production Migration

To move to real scanning:
1. Replace `mockScan()` with Puppeteer/Playwright implementation
2. Implement actual browser automation
3. Add real screenshot capture
4. Implement network request interception
5. Add error handling for browser failures

---

## 📦 Dependencies

### Core Dependencies
```json
{
  "@google/genai": "^1.34.0",  // Gemini AI SDK
  "react": "^19.2.3",
  "react-dom": "^19.2.3"
}
```

### Development Dependencies
```json
{
  "vite": "^6.2.0",
  "typescript": "~5.8.2",
  "@vitejs/plugin-react": "^5.0.0",
  "@types/node": "^22.14.0"
}
```

### Missing Dependencies (for production)
- `puppeteer` or `playwright` - For real browser automation
- `lucide-react` - Mentioned in technical breakdown but not in package.json

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Update Impressum with real business details
- [ ] Move AI calls to backend API routes
- [ ] Set up environment variables in hosting platform
- [ ] Configure CORS for Gemini API
- [ ] Implement rate limiting
- [ ] Add error monitoring (Sentry, etc.)
- [ ] Set up analytics
- [ ] Test all features in staging environment

### Production Environment Variables

Set in hosting platform (Vercel, Netlify, etc.):
- `VITE_API_KEY` or `GEMINI_API_KEY`
- Any other required environment variables

### Build & Deploy

```bash
npm run build
# Deploy dist/ directory to hosting platform
```

---

## 🐛 Known Issues & Solutions

### Issue: JSON Parse Error

**Symptom**: "AI response was not valid JSON"

**Cause**: Gemini sometimes wraps JSON in markdown code blocks

**Solution**: `extractJSON()` helper function handles this automatically

### Issue: API Key Not Found

**Symptom**: "Gemini API key not found" error

**Solutions**:
1. Verify `.env.local` exists with `VITE_API_KEY` or `GEMINI_API_KEY`
2. Restart dev server after adding environment variable
3. Check variable name spelling (case-sensitive)

### Issue: CORS Errors

**Symptom**: Network errors when calling Gemini API

**Solution**: Ensure Google Cloud Project allows your domain in CORS settings

---

## 📚 Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [German Impressum Requirements](https://www.gesetze-im-internet.de/tmg/)

---

## 🎯 Next Steps

1. **Immediate**: Update Impressum with real business details
2. **Short-term**: Move AI calls to backend API routes
3. **Medium-term**: Replace mock scanner with Puppeteer
4. **Long-term**: Add comprehensive testing suite
5. **Future**: Implement user authentication and scan history

---

**Last Updated**: Based on Google AI Studio technical breakdown
**Version**: Enhanced Consent Cop with Gemini AI
**Model**: gemini-3-pro-preview

