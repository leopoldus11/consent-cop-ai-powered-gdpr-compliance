# Consent Cop Setup Guide

## 🎯 Project Overview

**Consent Cop** is a GDPR compliance testing tool enhanced with **Google Gemini AI**. It scans websites to detect consent violations and provides AI-powered analysis and recommendations.

### Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **AI Integration**: Google Gemini AI (@google/genai)
- **Styling**: Tailwind CSS (via CDN)

---

## 📋 Prerequisites Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- React 19.2.3
- @google/genai 1.34.0 (Gemini AI SDK)
- Vite and TypeScript tooling

### Step 2: Configure Environment Variables

1. **Create `.env.local` file** in the project root:
   ```bash
   # Create the file
   touch .env.local
   ```

2. **Add your Gemini API key**:
   ```env
   # Recommended: Use VITE_API_KEY (Vite-native approach)
   VITE_API_KEY=your_actual_api_key_here
   
   # Alternative: GEMINI_API_KEY (also supported for backward compatibility)
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

   **To get your API key:**
   - Visit https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and paste it in `.env.local`

3. **Verify the file**:
   ```bash
   # Check that .env.local exists (it won't show in git)
   ls -la | grep .env
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### Step 4: Test the Application

1. Open http://localhost:3000 in your browser
2. Enter a URL in the scanner (e.g., `https://example.com`)
3. Click "Start Scan"
4. Wait for the scan to complete (mock data will be used)
5. Verify the AI analysis appears in the "Gemini Compliance Advisor" section

---

## 🔍 Understanding the Architecture

### Gemini AI Integration Points

1. **`services/gemini.ts`**
   - `analyzeScanResult()`: Analyzes complete scan results
   - `getDeepBeaconAnalysis()`: Forensic analysis of tracking parameters
   - Uses `gemini-3-pro-preview` model
   - Returns structured JSON responses

2. **`components/AiAdvisor.tsx`**
   - Displays AI analysis results
   - Shows severity, executive summary, remediation steps
   - Includes legal context and disclaimers

3. **`App.tsx`**
   - Orchestrates scan → AI analysis flow
   - Manages loading states for AI processing

### Data Flow

```
User enters URL
    ↓
Scanner triggers mockScan()
    ↓
ScanResult created
    ↓
analyzeScanResult() called with Gemini AI
    ↓
AIAnalysis returned
    ↓
AiAdvisor component displays results
```

---

## 🔧 Configuration Details

### Environment Variables

| Variable | Location | Usage |
|----------|----------|-------|
| `VITE_API_KEY` | `.env.local` | Recommended: Vite-native approach, accessible via `import.meta.env.VITE_API_KEY` |
| `GEMINI_API_KEY` | `.env.local` | Alternative: Also supported, mapped via `vite.config.ts` for backward compatibility |

**Note**: The code supports both approaches. `VITE_API_KEY` is preferred as it's the Vite-native way.

### Vite Configuration

- **Port**: 3000 (configurable in `vite.config.ts`)
- **Host**: 0.0.0.0 (accessible from network)
- **Environment**: Variables from `.env.local` are loaded and defined at build time

### Important Notes

⚠️ **Security Consideration**: The API key is currently exposed to the client-side code. For production, consider:
- Moving AI calls to a backend API route
- Using server-side API key management
- Implementing rate limiting

---

## 🐛 Troubleshooting

### Issue: "API_KEY is not defined"

**Symptoms**: Console errors about undefined API_KEY or missing Gemini API key

**Solutions**:
1. Verify `.env.local` exists in project root
2. Check that either `VITE_API_KEY` or `GEMINI_API_KEY` is set (no quotes needed)
3. Ensure the variable name starts with `VITE_` if using Vite-native approach
4. Restart the dev server: `npm run dev` (environment variables are loaded at startup)
5. Clear browser cache and hard refresh
6. Check that the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)

### Issue: Gemini API Errors

**Symptoms**: Network errors or "API key invalid" messages

**Solutions**:
1. Verify API key is correct (no extra spaces)
2. Check API key quota in Google AI Studio
3. Ensure API key has proper permissions
4. Try generating a new API key

### Issue: Port 3000 Already in Use

**Symptoms**: "Port 3000 is already in use"

**Solutions**:
1. Kill the process: `lsof -ti:3000 | xargs kill -9`
2. Or change port in `vite.config.ts`:
   ```ts
   server: {
     port: 3001, // Change to different port
   }
   ```

### Issue: Module Not Found

**Symptoms**: Import errors for `@google/genai` or React

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

### Issue: AI Analysis Not Appearing

**Symptoms**: Scan completes but no AI analysis shows

**Solutions**:
1. Check browser console for errors
2. Verify API key is set correctly
3. Check network tab for API calls to Gemini
4. Verify the `analyzeScanResult` function is being called

---

## 📦 Production Build

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deployment Considerations

1. **Environment Variables**: Set `GEMINI_API_KEY` in your hosting platform
2. **API Key Security**: Move AI calls to backend for production
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Error Handling**: Add comprehensive error handling for AI failures

---

## 🧪 Testing

### Current State

- Uses **mock scanner** (`services/mockScanner.ts`) for development
- Real browser automation not yet implemented
- AI analysis works with mock data

### Future Enhancements

- Replace mock scanner with Puppeteer/Playwright
- Add real screenshot capture
- Implement actual network request interception
- Add unit tests for AI functions

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `App.tsx` | Main application component |
| `services/gemini.ts` | Gemini AI integration |
| `components/AiAdvisor.tsx` | AI analysis display |
| `vite.config.ts` | Build configuration |
| `types.ts` | TypeScript definitions |
| `.env.local` | Environment variables (not in git) |

---

## ✅ Setup Verification Checklist

After setup, verify:

- [ ] `npm install` completed without errors
- [ ] `.env.local` file exists with `GEMINI_API_KEY`
- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:3000
- [ ] Scanner accepts URL input
- [ ] Scan completes and shows results
- [ ] AI analysis appears in "Gemini Compliance Advisor" section
- [ ] No console errors related to API key

---

## 🆘 Getting Help

1. **Check the console**: Browser DevTools → Console tab
2. **Check network requests**: DevTools → Network tab
3. **Verify environment**: Ensure `.env.local` is correct
4. **Review logs**: Check terminal output from `npm run dev`

---

## 🎉 Next Steps

Once setup is complete:

1. **Explore the UI**: Try scanning different URLs
2. **Review AI Analysis**: Check the detailed recommendations
3. **Customize Prompts**: Modify prompts in `services/gemini.ts`
4. **Add Real Scanner**: Replace mock scanner with Puppeteer
5. **Deploy**: Set up production deployment

---

**Happy Coding! 🚀**

