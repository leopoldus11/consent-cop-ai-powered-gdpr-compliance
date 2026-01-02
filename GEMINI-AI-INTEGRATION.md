# Gemini AI Integration Guide

## Overview

Consent Cop uses **Google Gemini 3 Pro** to provide intelligent analysis of GDPR compliance scan results. The AI integration adds:

- Executive summaries with business impact
- Severity assessments (Critical, High, Medium, Low)
- Prioritized remediation steps
- Legal context with GDPR article references
- Forensic beacon analysis

---

## Architecture

### AI Service Layer (`services/gemini.ts`)

Two main functions handle AI interactions:

#### 1. `analyzeScanResult(result: ScanResult)`

**Purpose**: Analyzes complete scan results and generates comprehensive compliance report.

**Input**: `ScanResult` object containing:
- URL scanned
- Violation count
- Request logs
- Detected technologies (TMS, CMP)
- Risk score

**Output**: `AIAnalysis` object with:
- Executive summary
- Severity level
- Remediation steps (3 prioritized actions)
- Legal context (GDPR articles)
- Disclaimer

**Model**: `gemini-3-pro-preview`

**Response Format**: Structured JSON with schema validation

**Example Usage**:
```typescript
const scanResult = await mockScan('https://example.com');
const analysis = await analyzeScanResult(scanResult);
// analysis contains: summary, severity, remediationSteps, legalContext, disclaimer
```

#### 2. `getDeepBeaconAnalysis(domain: string, params: Record<string, string>)`

**Purpose**: Performs forensic analysis of tracking parameters to identify data exfiltration.

**Input**:
- Domain name
- Tracking parameters (query strings, POST data)

**Output**: `BeaconAnalysis` object with:
- Classification (tracker type)
- Data exfiltration details
- Forensic evidence
- Technical remediation

**Model**: `gemini-3-pro-preview`

**Use Case**: Deep dive into specific tracking beacons to understand what data is being sent.

---

## Prompt Engineering

### Analyze Scan Result Prompt

The prompt instructs Gemini to act as a "Senior Data Privacy Consultant" and provides:

1. **Context**: Scan results, violation count, technologies detected
2. **Output Structure**: 
   - Executive Summary (business impact)
   - Severity Assessment (based on PII leakage)
   - Remediation Steps (3 clear technical steps)
   - Legal Context (GDPR articles, ePrivacy Directive)
   - Disclaimer (AI tool, not legal advice)

### Response Schema

The AI response is constrained to a specific JSON schema:

```typescript
{
  summary: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  remediationSteps: Array<{
    title: string;
    description: string;
    priority: 'Immediate' | 'Next' | 'Soon';
  }>;
  legalContext: string;
  disclaimer: string;
}
```

This ensures consistent, structured responses that can be directly used in the UI.

---

## Integration Flow

### In `App.tsx`

```typescript
const startScan = async (url: string) => {
  setIsScanning(true);
  
  // 1. Run scan (currently mock)
  const scanData = await mockScan(url);
  setResult(scanData);
  
  // 2. Trigger AI analysis
  setIsAiLoading(true);
  const aiData = await analyzeScanResult(scanData);
  setAiAnalysis(aiData);
  
  setIsScanning(false);
  setIsAiLoading(false);
};
```

### Display in `AiAdvisor.tsx`

The `AiAdvisor` component receives the `AIAnalysis` and displays:
- Severity badge with color coding
- Executive summary
- Remediation action plan with priority indicators
- Legal context in highlighted box
- Disclaimer footer

---

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_api_key_here
```

The API key is:
1. Loaded from `.env.local` by Vite
2. Exposed as `process.env.API_KEY` in code (via `vite.config.ts`)
3. Used to initialize `GoogleGenAI` client

### Vite Configuration

In `vite.config.ts`:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

This replaces `process.env.API_KEY` at build time with the actual API key value.

---

## API Client Initialization

**Important**: The `GoogleGenAI` client is initialized **inside each function** to ensure it picks up the latest API key from environment variables.

```typescript
export const analyzeScanResult = async (result: ScanResult) => {
  // Initialize inside function to use latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // ... rest of function
};
```

This pattern follows `@google/genai` best practices for dynamic API key handling.

---

## Error Handling

Currently, errors are caught in `App.tsx`:

```typescript
try {
  const aiData = await analyzeScanResult(scanData);
  setAiAnalysis(aiData);
} catch (err) {
  console.error("Scan failed", err);
}
```

**Recommended Enhancements**:
- Add user-friendly error messages
- Implement retry logic for transient failures
- Add fallback responses when AI is unavailable
- Log errors for monitoring

---

## Model Selection

**Current Model**: `gemini-3-pro-preview`

**Why Pro?**
- High-reasoning capabilities for forensic analysis
- Better understanding of legal and technical contexts
- Structured output with schema validation
- Handles complex multi-step analysis

**Alternative Models** (if needed):
- `gemini-1.5-pro`: Stable production model
- `gemini-1.5-flash`: Faster, lower cost (for simpler tasks)

---

## Cost Considerations

### API Usage

- Each scan triggers one `analyzeScanResult` call
- Each beacon analysis triggers one `getDeepBeaconAnalysis` call
- Model: `gemini-3-pro-preview` (premium pricing)

### Optimization Tips

1. **Cache Results**: Store AI analysis for repeated scans
2. **Batch Analysis**: Analyze multiple beacons in one call
3. **Use Flash Model**: For simpler analyses, use `gemini-1.5-flash`
4. **Rate Limiting**: Implement client-side rate limiting

---

## Testing

### Mock Data

Currently uses `mockScanner.ts` which provides:
- Sample violation data
- Mock request logs
- Test screenshots

### Testing AI Integration

1. **With Valid API Key**:
   - Run scan with real API key
   - Verify AI analysis appears
   - Check response structure matches schema

2. **Without API Key**:
   - Should show error or fallback
   - Currently may fail silently

3. **With Invalid API Key**:
   - Should show API error
   - Handle gracefully

---

## Future Enhancements

### Recommended Improvements

1. **Backend API Route**
   - Move AI calls to server-side
   - Protect API key
   - Add rate limiting
   - Implement caching

2. **Enhanced Prompts**
   - Add industry-specific context
   - Include user's compliance framework
   - Customize for different regions (GDPR, CCPA, etc.)

3. **Streaming Responses**
   - Stream AI responses for better UX
   - Show progress as analysis generates

4. **Multi-Model Support**
   - Use Flash for simple tasks
   - Use Pro for complex analysis
   - Fallback chain

5. **Error Recovery**
   - Retry logic
   - Fallback responses
   - User-friendly error messages

---

## Troubleshooting

### AI Analysis Not Appearing

1. Check API key is set in `.env.local`
2. Verify API key is valid in Google AI Studio
3. Check browser console for errors
4. Verify network requests to Gemini API

### API Errors

1. **Invalid API Key**: Regenerate in AI Studio
2. **Quota Exceeded**: Check usage in AI Studio dashboard
3. **Rate Limit**: Implement delays between requests
4. **Model Unavailable**: Check model name is correct

### Response Format Issues

1. Verify schema matches expected structure
2. Check for JSON parsing errors
3. Validate response in browser console
4. Review prompt for clarity

---

## Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
- [Gemini Models](https://ai.google.dev/models/gemini)

---

**Last Updated**: Project setup phase
**Model Version**: gemini-3-pro-preview
**SDK Version**: @google/genai ^1.34.0


