# Quick Start: Real Scanner

## 🚀 Get Real Scanning Working in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

This installs Puppeteer, Express, and all required packages.

### Step 2: Configure Environment

Add to `.env.local`:

```env
# Required: Gemini AI key
VITE_API_KEY=your_gemini_api_key_here

# Optional: Enable real scanner (defaults to mock)
VITE_USE_REAL_SCANNER=true
VITE_API_URL=http://localhost:3001
```

### Step 3: Start Servers

```bash
npm run dev
```

This starts:
- **Frontend** on http://localhost:3000
- **Backend API** on http://localhost:3001

---

## ✅ Test It

1. Open http://localhost:3000
2. Enter `https://dertour.de`
3. Click "Run Compliance Check"
4. Wait 10-30 seconds for real scan
5. See actual results with real screenshots!

---

## 🔄 Switching Between Mock and Real

**Use Mock** (fast, for development):
```env
# Remove or set to false
VITE_USE_REAL_SCANNER=false
```

**Use Real** (actual scanning):
```env
VITE_USE_REAL_SCANNER=true
```

The app automatically detects which to use based on this setting.

---

## 🐛 Troubleshooting

**"Scan failed: Network error"**
→ Make sure backend is running: `npm run dev:server`

**"Puppeteer not found"**
→ Run: `npm install puppeteer --force`

**Scan takes long time**
→ This is normal! Real scans take 10-30 seconds.

---

## 📚 Full Documentation

See `REAL-SCANNER-SETUP.md` for complete details.

---

**That's it!** You now have real website scanning! 🎉

