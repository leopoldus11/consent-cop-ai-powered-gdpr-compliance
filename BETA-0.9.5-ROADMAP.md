# Beta v0.9.5 Release Roadmap

## 🎯 Goal
Launch Consent Cop as a functional Beta portfolio project with user authentication, scan limits, and professional polish.

---

## 📋 Phase 1: Foundation (Critical Path)

### 1.1 Google OAuth Integration
- [ ] Install `@react-oauth/google` or similar
- [ ] Set up Google OAuth credentials
- [ ] Create login/logout flow
- [ ] Protect routes (require auth for scanning)
- [ ] Store user session (localStorage/cookies)

### 1.2 User Management & Scan Limits
- [ ] User data model (email, name, scanCount, lastScanDate)
- [ ] Weekly scan limit logic (e.g., 5 scans/week)
- [ ] Scan counter UI component
- [ ] Block scanning when limit reached
- [ ] Reset logic (weekly reset)

### 1.3 Google Sheets Integration
- [ ] Set up Google AppScript endpoint
- [ ] Create user registration API call
- [ ] Collect: timestamp, email, name, initial_credits, browser_info, location_hint
- [ ] Handle duplicate user detection
- [ ] Error handling

---

## 📋 Phase 2: Design & UX

### 2.1 Mobile Responsiveness
- [ ] Audit all components for mobile
- [ ] Responsive Timeline component
- [ ] Mobile-friendly navigation
- [ ] Touch-friendly buttons
- [ ] Mobile-optimized forms

### 2.2 Request Lifecycle Redesign (Lighthouse-style)
- [ ] Horizontal timeline container
- [ ] Dots/markers for requests
- [ ] Collapsible table below timeline
- [ ] Group by domain (e.g., "www.dertour.de")
- [ ] Expandable rows for request details
- [ ] Lighthouse-inspired styling

### 2.3 Scan History & Cache
- [ ] Display previously scanned URLs
- [ ] Show scan date, results summary
- [ ] "Restart Scan" button (uses cache if available)
- [ ] List view with search/filter
- [ ] Clear cache option

### 2.4 Footer & Legal Pages
- [ ] Footer component with links
- [ ] Imprint page (Impressum)
- [ ] Data Privacy page (Datenschutz)
- [ ] Legal content templates

---

## 📋 Phase 3: Features

### 3.1 PDF Export
- [ ] Install PDF library (e.g., `jspdf`, `react-pdf`)
- [ ] Generate PDF from scan results
- [ ] Include: summary, violations, recommendations
- [ ] Download button in results view
- [ ] Professional PDF formatting

### 3.2 Design Polish
- [ ] Final design review
- [ ] Consistent spacing/typography
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Accessibility audit

---

## 📋 Phase 4: Deployment Prep

### 4.1 Environment Setup
- [ ] Production environment variables
- [ ] API keys secured
- [ ] CORS configuration
- [ ] Rate limiting

### 4.2 Testing
- [ ] Test OAuth flow
- [ ] Test scan limits
- [ ] Test PDF generation
- [ ] Test mobile responsiveness
- [ ] Cross-browser testing

### 4.3 Documentation
- [ ] Update README
- [ ] Deployment guide
- [ ] User guide (Beta)

---

## 🎨 Design Interview Questions

Before implementing the Request Lifecycle redesign, I need to understand:

1. **Timeline Layout:**
   - Should the timeline be at the top with dots representing requests?
   - How should we show pre-consent vs post-consent visually?
   - Should dots be color-coded by request type (script/xhr/pixel)?

2. **Table Design:**
   - Should domains be collapsible groups (like Lighthouse)?
   - What columns should we show? (Domain, URL, Type, Status, Timing, Data Types?)
   - Should violations be highlighted differently?

3. **Interaction:**
   - Click on timeline dot → scroll to table row?
   - Hover on dot → show tooltip?
   - Expand/collapse all domains?

4. **Mobile:**
   - How should this work on mobile? (Horizontal scroll for timeline?)
   - Should table be simplified on mobile?

---

## 🚀 Implementation Order

1. **Week 1: Foundation**
   - OAuth integration
   - User management
   - Scan limits

2. **Week 2: Design**
   - Request Lifecycle redesign
   - Mobile responsiveness
   - Footer & legal pages

3. **Week 3: Features**
   - PDF export
   - Scan history
   - Google Sheets integration

4. **Week 4: Polish & Deploy**
   - Design polish
   - Testing
   - Deployment

---

## 📝 Next Steps

1. **Answer design interview questions** (above)
2. **Set up Google OAuth credentials** (need client ID)
3. **Set up Google Sheets** (need spreadsheet ID and AppScript URL)
4. **Choose deployment platform** (Vercel, Netlify, etc.)

Let's start! 🚀


