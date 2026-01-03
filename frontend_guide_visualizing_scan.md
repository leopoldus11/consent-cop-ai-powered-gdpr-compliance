# Frontend Guide: Visualizing Scanner Progress

## Problem
The `scanWebsite` operation is long-running (15-60s) and currently provides no feedback until completion, leaving users uncertain.

## Backend Context
The backend `scanWebsite` function now tracks distinct phases of the scan. While currently these are returned *after* completion in `ScanResult.performanceMetrics`, knowledge of these phases allows the Frontend to simulate or visualize the process more accurately.

### Scanner Phases
1.  **Browser Launch** (~1-2s): Starting headless browser.
2.  **Navigation** (~2-10s): Loading the target URL.
3.  **Banner Detection** (~2s): Identifying cookie banners.
4.  **Consent Interaction** (~2-5s): Clicking "Accept" or "Reject".
5.  **Post-Consent Wait** (~1-15s): Waiting for tracking scripts to fire (Variable! Ends early if network is idle).
6.  **Gemini Analysis** (~5-10s): AI fallback for detection (if needed).
7.  **Analysis & Scoring** (<1s): Processing results.

## Recommended UI Implementation (for Cursor)

Since the API is currently request-response (not streaming), implementing a **"Optimistic Progress UI"** is the best immediate solution.

### 1. Stepper / Checklist Component
Display a live checklist that updates based on *estimated* times.

- [ ] **Initializing Scanner** (0s)
- [ ] **Loading Website** (+1s)
- [ ] **Detecting Consent Banners** (+5s)
- [ ] **Interacting with Banner** (+7s)
- [ ] **Analyzing Network Traffic** (+10s)
- [ ] **AI Verification (Gemini)** (+25s)

*Animation Tip*: Use a progress bar that moves quickly to 80% and then slows down (Zeno's paradox style) until the actual response comes back.

### 2. Result Visualization
Once the `ScanResult` returns, you can show the *actual* times from `result.performanceMetrics` in a "Scan Performance" accordion, proving to the user what happened.

```typescript
// Interface for reference
interface PerformanceMetrics {
  totalDuration: number;
  browserLaunch: number;
  navigation: number;
  bannerDetection: number;
  consentInteraction: number;
  postConsentWait: number; // This is the "Network Traffic" phase
  geminiAnalysis: number;
}
```

## Future Architecture (Suggestion)
For true real-time feedback, we should refactor the backend to use **Server-Sent Events (SSE)**.
- **Endpoint**: `GET /api/scan/stream?url=...`
- **Events**: `type: 'progress', phase: 'navigation'`, `type: 'log', message: 'Banner found'`
- **Frontend**: `EventSource` listening to update the UI instantly.

*Note for Cursor*: If you decide to implement the SSE approach, ask Antigravity to expose the `onProgress` callback in `scanner.ts`.
