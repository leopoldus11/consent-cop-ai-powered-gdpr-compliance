# AI Assistant Onboarding: Consent Cop Enhanced with Gemini AI

## Project Context

This is **Consent Cop**, a GDPR compliance testing tool that has been enhanced with Google Gemini AI features. The project has been optimized and redesigned through collaboration with Google AI Studio.

### Original Project History

**Previous Version**: Consent Cop v0.8.3
- Built with Next.js 16, TypeScript, React 19
- Used Puppeteer for browser automation
- Detected consent violations on websites
- Had free tier (5 scans/month) and Pro tier ($79/month)

**Previous Related Project**: Beacon Parser Pro
- A web analytics beacon analysis tool
- Built together with the user previously
- Contains learnings about tracking pixel analysis and visualization patterns

### Current State

The user has:
1. Worked with Google AI Studio to optimize Consent Cop
2. Integrated Gemini AI features into the application
3. Downloaded the enhanced version as a new directory
4. Wants to start fresh with a new GitHub repository

**You are now working with the NEW, enhanced version that includes Gemini AI integration.**

---

## What I Need to Know

### Immediate Questions to Ask the User

1. **Project Location**
   - Where is the new project directory located?
   - What is the directory name?
   - Is it already initialized as a git repository?

2. **Gemini AI Integration**
   - What Gemini AI features were added?
   - What API keys or environment variables are needed?
   - Are there any new dependencies in package.json?
   - How is Gemini AI being used (analysis, recommendations, explanations)?

3. **Changes from Previous Version**
   - What major features were added/removed?
   - What UI/UX changes were made?
   - Are there new routes, components, or API endpoints?
   - What database/storage changes (if any)?

4. **Setup Requirements**
   - Are there new environment variables?
   - Any new dependencies to install?
   - Any setup scripts or configuration needed?
   - Any migration needed from the old version?

5. **New GitHub Repository**
   - What should the repository name be?
   - Should it be public or private?
   - Any specific repository description?

---

## Initial Tasks Checklist

When starting work on this new project, here's what to do:

### Phase 1: Project Discovery
- [ ] Read the README.md (if it exists)
- [ ] Review package.json to understand dependencies
- [ ] Check for .env.example or environment variable documentation
- [ ] Review the project structure (app/, components/, lib/, etc.)
- [ ] Look for any setup documentation or scripts
- [ ] Identify Gemini AI integration points in the codebase

### Phase 2: Environment Setup
- [ ] Identify all environment variables needed
- [ ] Create .env.local file template
- [ ] Check for Gemini API key requirements
- [ ] Verify all dependencies are listed in package.json
- [ ] Check for any required system dependencies

### Phase 3: Code Review
- [ ] Understand the new Gemini AI integration
- [ ] Review new components related to AI features
- [ ] Check API routes for AI endpoints
- [ ] Review any new utility functions or libraries
- [ ] Understand the data flow for AI features

### Phase 4: Repository Setup
- [ ] Initialize git repository (if not already done)
- [ ] Create .gitignore appropriate for Next.js + AI integration
- [ ] Set up GitHub repository
- [ ] Create initial commit
- [ ] Push to GitHub
- [ ] Set up branch protection rules (if needed)

### Phase 5: Documentation
- [ ] Update or create README.md with:
  - Project description
  - Setup instructions
  - Environment variables
  - Gemini AI features documentation
  - Deployment instructions
- [ ] Document new AI features
- [ ] Create setup guide for new developers

### Phase 6: Testing & Verification
- [ ] Verify the project runs locally
- [ ] Test Gemini AI features (if possible)
- [ ] Check for any missing dependencies
- [ ] Verify environment variables are correctly referenced
- [ ] Test build process
- [ ] Check for linting errors

---

## Key Files to Review First

1. **package.json** - Dependencies, scripts, version
2. **README.md** - Project documentation
3. **.env.example** or **.env.local** - Environment variables
4. **app/** directory - Next.js App Router structure
5. **components/** - React components, especially AI-related ones
6. **lib/** - Utility functions, including any AI integration code
7. **app/api/** - API routes, especially new AI endpoints
8. **next.config.js/mjs** - Next.js configuration
9. **Any AI-related configuration files**

---

## Gemini AI Integration Patterns to Look For

When reviewing the code, look for:
- **API Integration**: Calls to Google's Gemini API
- **Environment Variables**: GEMINI_API_KEY, GOOGLE_AI_API_KEY, etc.
- **New Dependencies**: @google/generative-ai, google-ai, etc.
- **AI Components**: Components that display AI-generated content
- **AI API Routes**: Endpoints that process AI requests
- **Prompt Engineering**: Where and how prompts are constructed
- **AI Response Handling**: How AI responses are processed and displayed
- **Error Handling**: How AI API errors are handled
- **Loading States**: UI for AI processing states

---

## Common Tasks You May Need to Help With

1. **Setup & Installation**
   - Installing dependencies
   - Setting up environment variables
   - Configuring API keys
   - Running the development server

2. **Code Understanding**
   - Explaining new Gemini AI features
   - Understanding the architecture
   - Identifying integration points
   - Reviewing code structure

3. **Troubleshooting**
   - API connection issues
   - Missing dependencies
   - Environment variable problems
   - Build errors
   - Runtime errors

4. **Enhancement**
   - Adding new features
   - Improving AI prompts
   - Optimizing AI integration
   - UI/UX improvements

5. **Deployment**
   - Vercel configuration
   - Environment variables setup
   - Deployment issues
   - Production optimization

---

## Questions to Ask the User First

Before diving in, ask:

1. "What directory is the new project in? Can you share the path?"
2. "What Gemini AI features were added? (e.g., violation analysis, recommendations, summaries)"
3. "Do you have the Gemini API key, or do we need to set that up?"
4. "Are there any setup instructions or documentation that came with the new version?"
5. "What's the biggest difference from the previous version you want me to focus on?"
6. "Do you want me to set up a new GitHub repository, or is there an existing one?"
7. "Are there any known issues or incomplete features I should be aware of?"

---

## Project Goals

Based on the context, the user likely wants to:
- ✅ Get the enhanced version running locally
- ✅ Set up a fresh GitHub repository
- ✅ Ensure all Gemini AI features work correctly
- ✅ Prepare for deployment
- ✅ Understand the new architecture and features

**Your role**: Help them understand, set up, and work with the Gemini AI-enhanced version of Consent Cop.

---

## Notes

- This is a continuation/evolution of Consent Cop, not a completely new project
- The user has experience with the original version
- They've worked with Google AI Studio, so the design is likely well-thought-out
- Focus on getting them up and running quickly
- Be ready to explain new AI features and help integrate them smoothly
- The project likely maintains the same core functionality (GDPR compliance testing) with AI enhancements

---

**When you start, begin by asking about the project location and what Gemini AI features were added, then proceed with the discovery phase.**

