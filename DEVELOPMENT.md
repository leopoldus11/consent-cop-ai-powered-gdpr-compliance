# Consent Cop - Development Architecture & Agent Source of Truth

This document serves as the architectural reference for the Consent Cop application, providing a comprehensive overview of data flow, state management, and key implementation details for agent orchestration.

## Table of Contents
1. [Data State & Storage](#data-state--storage)
2. [Variable Mapping](#variable-mapping)
3. [UI Layout Issues](#ui-layout-issues)
4. [Technology Detection](#technology-detection)

---

## Data State & Storage

### Network Request Storage

**Location**: Network requests are stored in the `ScanResult` object, specifically in the `requests` property.

**Data Flow**:
1. **Capture Phase** (`server/scanner.ts`):
   - Requests are captured via Playwright's `page.route()` and network monitoring
   - Stored temporarily in `allRequests: NetworkRequest[]` array during scan execution
   - Split into `requestsBefore` and `requestsAfter` based on `consentClickTimestamp`

2. **Processing Phase** (`server/scanner.ts::processRequests()`):
   - `processRequests()` converts `NetworkRequest[]` → `RequestLog[]`
   - Each request is tagged with `consentState: 'pre-consent' | 'post-consent'`
   - Logic: `consentClickTimestamp || Number.MAX_SAFE_INTEGER` determines split point
   - If consent was NOT clicked, all requests are marked as `'pre-consent'`

3. **Storage in Result**:
   - Final `RequestLog[]` array stored in `ScanResult.requests`
   - `ScanResult` is returned from `scanWebsite()` function
   - Frontend receives this via API call to `/api/scan`

### Pre-Consent vs Post-Consent Logic

**Key Variable**: `consentClickTimestamp: number | null`

**Tagging Logic** (`server/scanner.ts:1020, 1050`):
```typescript
// Pre-consent requests (line 1020)
consentState: 'pre-consent'  // Tagged when req.timestamp < consentClickTimestamp

// Post-consent requests (line 1050)
consentState: 'post-consent'  // Tagged when req.timestamp >= consentClickTimestamp
```

**Split Point Calculation** (`server/scanner.ts:430`):
```typescript
const splitTimestamp = consentClickTimestamp || Number.MAX_SAFE_INTEGER;
const requestsBefore = allRequests.filter(r => r.timestamp < splitTimestamp);
const requestsAfter = allRequests.filter(r => r.timestamp >= splitTimestamp);
```

**Critical Behavior**:
- If `consentClickTimestamp === null`, ALL requests are marked as `'pre-consent'`
- This ensures violations are still detected even if consent banner click fails

---

## Variable Mapping

### Core Data Objects

#### 1. `ScanResult` (Primary Result Object)
**Location**: `types.ts:16-67`
**Properties**:
- `id: string` - Unique scan identifier
- `url: string` - Scanned website URL
- `timestamp: string` - ISO timestamp of scan
- `riskScore: number` - Compliance risk score (0-100)
- `violationsCount: number` - Count of violation requests
- `compliantCount: number` - Count of compliant requests
- `requests: RequestLog[]` - **PRIMARY STORAGE** for network requests
- `dataLayers: string[]` - Detected data layer names (e.g., `['dataLayer', 'adobeDataLayer']`)
- `tmsDetected: string[]` - Detected TMS names (e.g., `['Google Tag Manager', 'Adobe Launch']`)
- `bannerProvider?: string` - CMP provider name (e.g., `'Usercentrics'`)

#### 2. `RequestLog` (Individual Request Object)
**Location**: `types.ts:4-14`
**Properties**:
- `id: string` - Unique request identifier (format: `'req_${index}'` or `'req_after_${index}'`)
- `domain: string` - Extracted hostname from URL
- `url: string` - Full request URL
- `timestamp: number` - Request timestamp (milliseconds since epoch)
- `type: 'pixel' | 'script' | 'xhr'` - Request type classification
- `status: 'allowed' | 'violation'` - Compliance status
- `dataTypes: string[]` - Inferred data types (e.g., `['Email', 'IP Address', 'Browser Fingerprint']`)
- `parameters?: Record<string, string>` - Extracted URL/postData parameters
- `consentState: 'pre-consent' | 'post-consent'` - **CRITICAL**: Determines if request fired before/after consent

#### 3. `NetworkRequest` (Internal Capture Format)
**Location**: `server/scanner.ts:29-36`
**Properties**:
- `url: string`
- `method: string`
- `headers: Record<string, string>`
- `postData?: string`
- `timestamp: number`
- `resourceType?: string` - Playwright resource type

**Conversion**: `NetworkRequest[]` → `RequestLog[]` via `processRequests()`

#### 4. Frontend State Variables
**Location**: `App.tsx`, `components/AuditResults.tsx`

- `result: ScanResult | null` - Current scan result (stored in React state)
- `filteredRequests: RequestLog[]` - Filtered requests based on UI filter selection
- `categorizedRequests: RequestLog[]` - Requests with category metadata (`'critical' | 'warning' | 'safe'`)

---

## UI Layout Issues

### Request Lifecycle Overflow Bug

**Issue**: During View Transitions API filtering, the request list container would break out of its `max-h-[500px]` constraint, causing visual overflow.

**Root Cause** (`components/AuditResults.tsx:696-699`):
- The scroll container structure was: `overflow-hidden` parent → `overflow-y-auto` child
- During View Transitions, the browser's paint containment was not properly enforced
- List items lacked CSS containment properties, allowing them to expand beyond parent bounds

**Fix Applied** (`components/AuditResults.tsx:697-699, 736-740`):
```typescript
// Fixed structure:
<div className="relative max-h-[500px] overflow-hidden border...">
  <div className="h-full overflow-y-auto custom-scrollbar p-4" 
       style={{ contain: 'layout paint' }}>
    <div className="relative min-h-[400px]" style={{ contain: 'layout' }}>
      {/* Request items with contain: 'layout paint' on each */}
      <div style={{ 
        viewTransitionName: `req-item-${req.id}`,
        contain: 'layout paint'  // CRITICAL: Prevents overflow during transitions
      }}>
```

**Key CSS Properties**:
- `contain: 'layout paint'` - Tells browser to isolate layout/paint calculations within element
- Applied to: scroll container, inner container, and each request item
- Prevents View Transitions from breaking containment during filter animations

**Filter State**:
- `filter: 'all' | 'violations' | 'pre-consent'` - Controls which requests are displayed
- Filtered via `filteredRequests` useMemo hook (`components/AuditResults.tsx:330-339`)

---

## Technology Detection

### CMS (Consent Management Platform) Detection

**Function**: `detectConsentManagementSystem()`  
**Location**: `server/detectors.ts:200-263`

**Detection Method**:
1. **Pattern Matching**: Checks `CMS_SIGNATURES` patterns against:
   - Page HTML content (score: +2 per match)
   - Network request URLs (score: +3 per match - higher weight)
2. **Scoring System**: Each CMS gets a confidence score
   - `score >= 5`: `confidence: 'high'`
   - `score >= 3`: `confidence: 'medium'`
   - `score < 3`: `confidence: 'low'`
3. **Result**: Returns `CMSDetectionResult` with:
   - `detected: ConsentManagementSystem[]` - All detected CMSs
   - `primary: ConsentManagementSystem` - Highest scoring CMS
   - `confidence: 'high' | 'medium' | 'low'`

**Supported CMSs** (`server/detectors.ts:43-129`):
- Usercentrics
- OneTrust
- Cookiebot
- Quantcast Choice
- Didomi
- TrustArc
- And 10+ more...

### TMS (Tag Management System) Detection

**Function**: `detectTagManagementSystems()`  
**Location**: `server/detectors.ts:303-441`

**Detection Method**:
1. **Priority Logic**:
   - **First**: Check if Adobe Launch is actually firing (`isAdobeLaunchActuallyFiring()`)
   - **Second**: Check if GTM is actually firing (`isGTMActuallyFiring()`)
   - **Third**: Evidence-based scoring for other TMSs

2. **Firing Detection** (Strict Patterns):
   - **GTM**: Only if `googletagmanager.com/gtm.js?id=GTM-XXXXX` pattern found
   - **Adobe Launch**: Only if `assets.adobedtm.com/*/launch-*.min.js` or `AppMeasurement.min.js` found
   - **Rationale**: Prevents false positives from generic `dataLayer` usage

3. **Evidence Scoring**:
   - Network requests: Highest weight (strongest evidence)
   - Script tags: Medium weight
   - Page content: Lower weight

**Supported TMSs** (`server/detectors.ts:131-195`):
- Google Tag Manager (GTM)
- Adobe Launch
- Adobe Experience Platform Web SDK (AEP)
- Tealium
- Segment
- And 5+ more...

### Data Layer Detection

**Function**: `extractDataLayers()`  
**Location**: `server/scanner.ts` (inline in `scanWebsite()`)

**Detection Method**:
1. **JavaScript Context Extraction** (`extractJavaScriptContext()`):
   - Evaluates `window` object for known data layer names
   - Checks: `dataLayer`, `adobeDataLayer`, `digitalData`, `_satellite`, etc.
   - Scans inline scripts for data layer initialization patterns

2. **Anti-Bot Retry Logic**:
   - If objects detected but no data layers found, retries with jittered delays (2s, 4s, 6s)
   - Prevents false negatives from delayed data layer initialization

3. **Result**: Array of data layer names stored in `ScanResult.dataLayers: string[]`

**Common Data Layers**:
- `dataLayer` (GTM standard)
- `adobeDataLayer` (Adobe AEP)
- `digitalData` (Adobe Launch legacy)
- `utag_data` (Tealium)
- `_satellite` (Adobe Launch)

---

## Key Implementation Notes

### Request Categorization Logic

**Location**: `components/AuditResults.tsx:309-390`

**Category Assignment**:
1. **RED (Critical)**: `consentState === 'pre-consent'` AND category is `'marketing' | 'analytics' | 'social'`
2. **YELLOW (Warning)**: `consentState === 'pre-consent'` AND category is `'fingerprinting'` OR has `dataTypes.length > 0`
3. **GREEN (Safe)**: All other requests (post-consent or strictly necessary)

**Category Detection** (`detectRequestCategory()`):
- Marketing: `doubleclick`, `googleadservices`, `facebook.com/tr`, etc.
- Analytics: `google-analytics`, `googletagmanager`, `appmeasurement`, etc.
- Social: `facebook.com/tr`, `linkedin.*tracking`, etc.
- Fingerprinting: `fingerprint`, `fpjs`, `client.*hints`, etc.

### View Transitions API

**Usage**: Smooth animations when filtering request lists
**Implementation**: `document.startViewTransition()` wrapper around `setFilter()`
**View Transition Names**: Each request item has `view-transition-name: req-item-${req.id}`

---

## File Structure Reference

```
server/
  scanner.ts          # Main scanning logic, request capture & processing
  detectors.ts        # CMS/TMS detection functions
  scoring.ts          # Risk score calculation

components/
  AuditResults.tsx   # Results display, filtering, categorization
  Scanner.tsx         # URL input & scan trigger
  Layout.tsx          # Navigation, header, footer

services/
  realScanner.ts     # API client for /api/scan endpoint
  gemini.ts          # AI analysis integration
  auth.ts            # User session & scan limits

types.ts             # TypeScript interfaces (ScanResult, RequestLog, etc.)
```

---

## Agent Orchestration Notes

- **Primary Data Source**: `ScanResult.requests: RequestLog[]`
- **Filtering**: Always check `consentState` property for pre/post-consent logic
- **UI Updates**: Use View Transitions API for smooth filter animations
- **Detection**: CMS/TMS detection happens server-side, results stored in `ScanResult`
- **State Management**: React state in `App.tsx`, passed as props to child components

---

*Last Updated: 2025-01-XX*
*Branch: main*
*Commit: b453fe4*

