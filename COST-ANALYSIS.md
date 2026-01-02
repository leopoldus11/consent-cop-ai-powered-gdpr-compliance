# Cost Analysis Per Scan Run

## API Calls Per Scan

### **Guaranteed Calls (Every Scan)**
1. **`analyzeScanResult()`** - Main AI analysis
   - **Model**: `gemini-3-pro-preview`
   - **Input**: ~500-800 tokens (scan summary, violation count, technologies)
   - **Output**: ~800-1,200 tokens (executive summary, remediation, legal context)
   - **Frequency**: **1 call per scan**

### **Conditional Calls (Fallback Only)**
2. **`detectTMSWithGemini()`** - TMS detection via HTML analysis
   - **Model**: `gemini-3-pro-preview`
   - **Input**: ~15,000-20,000 tokens (50KB HTML + 50 script URLs + 20KB inline scripts)
   - **Output**: ~300-500 tokens (detected TMS names, confidence, evidence)
   - **Frequency**: **Only if standard detection fails** (typically < 20% of scans)

3. **`detectDataLayersWithGemini()`** - Data layer detection via HTML analysis
   - **Model**: `gemini-3-pro-preview`
   - **Input**: ~15,000-20,000 tokens (50KB HTML + 50 script URLs + 20KB inline scripts)
   - **Output**: ~300-500 tokens (detected data layer names, confidence, evidence)
   - **Frequency**: **Only if standard detection fails** (typically < 20% of scans)

### **Optional Calls (User-Triggered)**
4. **`getDeepBeaconAnalysis()`** - Deep forensic analysis
   - **Model**: `gemini-3-pro-preview`
   - **Input**: ~200-500 tokens (domain + tracking parameters)
   - **Output**: ~400-600 tokens (classification, data exfiltration details)
   - **Frequency**: **Per beacon when user clicks "Analyze"** (not automatic)

## Cost Estimation (Gemini 3 Pro Preview)

**Note**: Gemini 3 Pro Preview pricing is typically:
- **Input**: ~$7-10 per 1M tokens
- **Output**: ~$21-30 per 1M tokens

### **Best Case (Standard Detection Works)**
- 1 × `analyzeScanResult`: 
  - Input: ~700 tokens = **$0.005-0.007**
  - Output: ~1,000 tokens = **$0.021-0.030**
  - **Total: ~$0.026-0.037 per scan**

### **Worst Case (Fallbacks Needed)**
- 1 × `analyzeScanResult`: ~$0.026-0.037
- 1 × `detectTMSWithGemini`: 
  - Input: ~18,000 tokens = **$0.126-0.180**
  - Output: ~400 tokens = **$0.008-0.012**
  - Total: **$0.134-0.192**
- 1 × `detectDataLayersWithGemini`: 
  - Input: ~18,000 tokens = **$0.126-0.180**
  - Output: ~400 tokens = **$0.008-0.012**
  - Total: **$0.134-0.192**
- **Total: ~$0.294-0.421 per scan**

## Monthly Cost Estimates

Assuming 1,000 scans/month:
- **Best case**: $26-37/month
- **Worst case**: $294-421/month
- **Realistic (50% need fallbacks)**: ~$160-230/month

## Cost Optimization Strategies

1. **Cache AI Analysis Results**: Store results for repeated URL scans
2. **Use Standard Detection First**: Only use Gemini fallbacks when necessary
3. **Batch Multiple Beacons**: Analyze multiple beacons in single call (if possible)
4. **Consider gemini-1.5-flash**: For simpler analyses, could reduce cost by 70-80%
5. **Implement Rate Limiting**: Prevent accidental runaway costs

## Other Costs

### **Infrastructure (Server Hosting)**
- **Playwright**: Free (open source)
- **Server Compute**: Depends on hosting (~$5-50/month for small deployments)
- **Bandwidth**: Minimal for scanning (~$1-5/month)

### **Total Monthly Cost Estimate**
- **AI (Gemini)**: $30-250/month (depending on usage)
- **Hosting**: $5-50/month
- **Total**: **$35-300/month** for moderate usage

## Free Tier & Limits

Google Gemini typically offers:
- **Free tier**: 15 RPM (requests per minute), 1,500 RPD (requests per day)
- **Paid tier**: Higher rate limits

For development/testing, you should be within free tier limits.


