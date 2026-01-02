# Request Lifecycle Redesign - Design Interview

## 🎨 Current State
- Waterfall visualization with domain rows
- Request bars positioned by timestamp
- Tooltips on hover
- Collapsible domain groups

## 🎯 Target: Lighthouse-Style Design

Based on your reference to Google Lighthouse, I need to understand your vision:

---

## 📊 Timeline Component Questions

### 1. Timeline Layout
**Q: How should the timeline be structured?**
- [ ] Horizontal bar at the top with dots/markers for each request?
- [ ] Should dots be positioned by timestamp (left to right = time progression)?
- [ ] Should there be a vertical "CONSENT ACTION" line dividing pre/post consent?
- [ ] How should we show the time scale? (0s, 5s, 10s markers above timeline?)

**My suggestion:** Horizontal timeline with:
- Time markers at top (0s, 5s, 10s, etc.)
- Dots positioned by timestamp
- Color-coded: Red (violation), Green (allowed)
- Size-coded: Larger dots for violations?
- Vertical dashed line for consent action

---

### 2. Dot/Marker Design
**Q: What should each dot represent?**
- [ ] One dot = one request?
- [ ] One dot = one domain (with count badge)?
- [ ] Different dot styles for different request types (script/xhr/pixel)?

**My suggestion:** 
- One dot per request (grouped visually if same timestamp)
- Color: Red (violation), Green (allowed), Blue (script), Amber (pixel)
- Hover: Show tooltip with request details
- Click: Scroll to corresponding table row

---

### 3. Visual Hierarchy
**Q: How should we distinguish important requests?**
- [ ] Larger dots for violations?
- [ ] Glow/shadow for violations?
- [ ] Different shapes? (circle for allowed, triangle for violation?)

**My suggestion:**
- Violations: Larger red dots with glow
- Allowed: Smaller green dots
- Request type: Border color (blue=script, amber=pixel, green=xhr)

---

## 📋 Table Component Questions

### 4. Table Structure
**Q: What should the table look like?**
- [ ] Collapsible groups by domain (like Lighthouse)?
- [ ] Flat list with domain column?
- [ ] Nested rows (domain → requests)?

**My suggestion:** Lighthouse-style:
```
▼ www.dertour.de (5 requests)
  ├─ assets.adobedtm.com/launch.js [VIOLATION] [SCRIPT] 0.2s
  ├─ dpm.demdex.net/id [VIOLATION] [PIXEL] 0.5s
  └─ ...
▼ api.usercentrics.eu (3 requests)
  └─ ...
```

---

### 5. Table Columns
**Q: What information should each row show?**
- [ ] Domain/URL
- [ ] Request type (script/xhr/pixel)
- [ ] Status (violation/allowed)
- [ ] Timing (timestamp)
- [ ] Data types collected
- [ ] Size/duration (if available)

**My suggestion:**
| Domain | Type | Status | Timing | Data Types | Actions |
|--------|------|--------|--------|------------|--------|
| assets.adobedtm.com | SCRIPT | 🔴 Violation | 0.2s | ID, IP Address | [Details] |

---

### 6. Grouping Logic
**Q: How should requests be grouped?**
- [ ] By domain only?
- [ ] By domain + status (violations vs allowed)?
- [ ] By timing (pre-consent vs post-consent)?

**My suggestion:**
- Primary: By domain
- Secondary: Sort by timestamp within domain
- Show counts: "5 violations, 3 allowed" in group header

---

## 🎨 Styling Questions

### 7. Color Scheme
**Q: Should we match Lighthouse's color scheme?**
- [ ] Orange/red for issues?
- [ ] Green for passed?
- [ ] Grey for informational?

**My suggestion:**
- Red: Violations (critical)
- Orange: Warnings (pre-consent but not violations)
- Green: Allowed (post-consent)
- Grey: Informational

---

### 8. Interaction Design
**Q: How should timeline and table interact?**
- [ ] Click timeline dot → highlight table row?
- [ ] Hover timeline dot → show tooltip?
- [ ] Click table row → highlight timeline dot?
- [ ] Scroll sync?

**My suggestion:**
- Hover dot → tooltip + highlight table row
- Click dot → scroll to table row
- Click table row → highlight dot
- Smooth scroll animation

---

## 📱 Mobile Considerations

### 9. Mobile Layout
**Q: How should this work on mobile?**
- [ ] Horizontal scroll for timeline?
- [ ] Simplified table (fewer columns)?
- [ ] Stack timeline above table?

**My suggestion:**
- Timeline: Horizontal scroll with snap points
- Table: Full width, simplified columns
- Touch-friendly expand/collapse
- Swipe gestures for navigation?

---

## ✅ Quick Answers Needed

Please answer these to proceed:

1. **Timeline style:** Horizontal bar with dots? ✅/❌
2. **Dot grouping:** One dot per request, or grouped by domain? 
3. **Table style:** Collapsible groups by domain (Lighthouse-style)? ✅/❌
4. **Color scheme:** Match Lighthouse (red/orange/green/grey)? ✅/❌
5. **Interaction:** Click dot → scroll to table row? ✅/❌

---

## 🚀 My Recommended Approach

Based on Lighthouse design, I suggest:

1. **Top Section:** Horizontal timeline bar
   - Time markers (0s, 5s, 10s)
   - Dots positioned by timestamp
   - Color-coded (red=violation, green=allowed)
   - Vertical consent line

2. **Bottom Section:** Collapsible table
   - Groups by domain
   - Expand/collapse all
   - Sortable columns
   - Row highlights on hover

3. **Interaction:**
   - Click dot → scroll to row
   - Hover dot → tooltip
   - Responsive design

**Does this match your vision?** Let me know and I'll implement it! 🎨


