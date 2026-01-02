# Development Cost Analysis

## API Usage Estimate (Based on Testing)

### Assumptions
- **Test scans run**: ~50-100 scans during development
- **Average scans per iteration**: ~5-10 scans
- **Gemini API calls per scan**:
  - Main analysis: 1 call (always)
  - TMS fallback: ~20% of scans (conditional)
  - Data layer fallback: ~20% of scans (conditional)

### Cost Breakdown

#### **Gemini API Costs**

**Per Scan (Best Case - No Fallbacks)**:
- `analyzeScanResult()`: 1 call × `gemini-3-pro-preview`
  - Input: ~700 tokens = $0.005-0.007
  - Output: ~1,000 tokens = $0.021-0.030
  - **Total: ~$0.026-0.037 per scan**

**Per Scan (Worst Case - With Fallbacks)**:
- `analyzeScanResult()`: $0.026-0.037
- `detectTMSWithGemini()`: 
  - Input: ~18,000 tokens = $0.126-0.180
  - Output: ~400 tokens = $0.008-0.012
  - **Total: $0.134-0.192**
- `detectDataLayersWithGemini()`:
  - Input: ~18,000 tokens = $0.126-0.180
  - Output: ~400 tokens = $0.008-0.012
  - **Total: $0.134-0.192**
- **Total: ~$0.294-0.421 per scan**

**Estimated Development Costs**:
- **Conservative (50 scans, 80% best case, 20% worst case)**:
  - 40 scans × $0.031 = $1.24
  - 10 scans × $0.357 = $3.57
  - **Total: ~$4.81**

- **Realistic (100 scans, 70% best case, 30% worst case)**:
  - 70 scans × $0.031 = $2.17
  - 30 scans × $0.357 = $10.71
  - **Total: ~$12.88**

- **Worst Case (100 scans, all with fallbacks)**:
  - 100 scans × $0.357 = **$35.70**

## **Total Estimated Development Cost: $5-35**

**Most Likely**: **~$10-15** (within free tier limits)

---

## Infrastructure Costs

- **Playwright**: Free (open source)
- **Server hosting**: $0 (local development)
- **Bandwidth**: $0 (local development)

**Total Infrastructure**: **$0**

---

## **Grand Total: ~$10-15**

*Note: This is well within Google Gemini's free tier limits (typically 15 RPM, 1,500 RPD)*


