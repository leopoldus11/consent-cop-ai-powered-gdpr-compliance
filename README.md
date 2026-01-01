<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Consent Cop - AI-Powered GDPR Compliance Testing

**Consent Cop** is a GDPR compliance testing tool enhanced with **Google Gemini AI** capabilities. It automatically scans websites to detect consent violations, analyzes tracking behaviors, and provides AI-powered recommendations for compliance remediation.

View your app in AI Studio: https://ai.studio/apps/drive/1FBsaIS-GwfKz8Y_2OMmq7a-toPK9Ld63

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.local file in the project root
   # Add your Gemini API key (use VITE_API_KEY for Vite-native approach)
   echo "VITE_API_KEY=your_gemini_api_key_here" > .env.local
   
   # Or use GEMINI_API_KEY (also supported for backward compatibility)
   # Get your API key from: https://aistudio.google.com/apikey
   ```
   
   **Note**: The app supports both `VITE_API_KEY` (recommended) and `GEMINI_API_KEY` (legacy) environment variable names.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The app should be running!

## 🎯 Features

### Core GDPR Compliance Testing
- **Automated Website Scanning**: Detects consent violations in real-time
- **Pre-Consent Request Detection**: Identifies tracking pixels and scripts that fire before user consent
- **Violation Timeline**: Visual timeline of all network requests
- **Risk Assessment**: Calculates compliance risk scores
- **Screenshot Capture**: Before/after consent state visualization

### Gemini AI Enhancements
- **AI-Powered Analysis**: Deep forensic analysis of scan results using Gemini 3 Pro
- **Executive Summaries**: High-level business impact assessments
- **Remediation Recommendations**: Prioritized action plans with technical steps
- **Legal Context**: GDPR article references and ePrivacy Directive compliance
- **Beacon Analysis**: Detailed tracking parameter analysis and data exfiltration detection

## 🏗️ Project Structure

```
consent-cop---ai-powered-gdpr-compliance/
├── components/
│   ├── AiAdvisor.tsx          # Gemini AI analysis display component
│   ├── Scanner.tsx            # URL input and scan trigger
│   ├── Timeline.tsx           # Request timeline visualization
│   ├── ViolationList.tsx      # Detailed violation listing
│   ├── RiskAssessment.tsx     # Risk score and metrics
│   ├── Layout.tsx             # Main app layout
│   └── InformationPages.tsx   # Static information pages
├── services/
│   ├── gemini.ts              # Gemini AI integration (analyzeScanResult, getDeepBeaconAnalysis)
│   └── mockScanner.ts         # Mock scanner for development/testing
├── App.tsx                     # Main application component
├── types.ts                    # TypeScript type definitions
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_KEY` | Your Google Gemini API key (recommended) | Yes* |
| `GEMINI_API_KEY` | Alternative name (also supported) | Yes* |

*Either `VITE_API_KEY` or `GEMINI_API_KEY` must be set.

### Vite Configuration

The project uses Vite with React. Key configuration:
- **Port**: 3000 (configurable in `vite.config.ts`)
- **Host**: 0.0.0.0 (accessible from network)
- **Environment Variables**: Loaded from `.env.local`

## 🤖 Gemini AI Integration

### AI Functions

1. **`analyzeScanResult(result: ScanResult)`**
   - Analyzes complete scan results
   - Generates executive summary, severity assessment, and remediation steps
   - Uses `gemini-3-pro-preview` model
   - Returns structured JSON with legal context

2. **`getDeepBeaconAnalysis(domain: string, params: Record<string, string>)`**
   - Performs forensic analysis of tracking parameters
   - Identifies data exfiltration patterns
   - Explains cross-site tracking capabilities
   - Provides technical remediation guidance

### AI Model Configuration

- **Model**: `gemini-3-pro-preview`
- **Response Format**: Structured JSON with schema validation
- **Use Case**: High-reasoning forensic tasks and compliance analysis

## 📦 Dependencies

### Core Dependencies
- `react` ^19.2.3
- `react-dom` ^19.2.3
- `@google/genai` ^1.34.0 (Gemini AI SDK)

### Development Dependencies
- `vite` ^6.2.0
- `typescript` ~5.8.2
- `@vitejs/plugin-react` ^5.0.0
- `@types/node` ^22.14.0

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Notes

- The app uses **mock scanner** (`mockScanner.ts`) for development
- Replace with real browser automation (e.g., Puppeteer) for production
- AI analysis requires valid `GEMINI_API_KEY` in `.env.local`
- All AI calls are made client-side (consider moving to API routes for production)

## 🚨 Troubleshooting

### Common Issues

1. **"API_KEY is not defined"**
   - Ensure `.env.local` exists and contains `GEMINI_API_KEY`
   - Restart the dev server after adding environment variables

2. **Gemini API Errors**
   - Verify your API key is valid and has quota remaining
   - Check API key permissions in Google AI Studio

3. **Port Already in Use**
   - Change the port in `vite.config.ts` or kill the process using port 3000

4. **Module Not Found Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear `node_modules` and reinstall if issues persist

## 📝 License

This project is part of the Consent Cop suite. See repository for license details.

## 🤝 Contributing

This is an enhanced version of Consent Cop with Gemini AI integration. For issues or contributions, please refer to the main repository.

---

**Built with ❤️ using Google Gemini AI**
