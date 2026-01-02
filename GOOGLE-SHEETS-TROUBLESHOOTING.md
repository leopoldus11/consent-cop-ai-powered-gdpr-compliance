# Google Sheets Integration - Troubleshooting Guide

## Why User Data Isn't Being Sent to Google Sheets

### Step 1: Check Environment Variable

The integration requires `VITE_GOOGLE_APPSCRIPT_URL` to be set in your environment.

**Check if it's configured:**
1. Look for `.env.local` file in the project root
2. It should contain:
   ```env
   VITE_GOOGLE_APPSCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

**If missing:**
1. Create `.env.local` in the project root
2. Add the line above with your AppScript URL
3. **Restart your dev server** (Vite requires restart to pick up new env vars)

### Step 2: Verify AppScript Deployment

1. **Check AppScript URL format:**
   - Should be: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
   - NOT: `https://script.google.com/home/projects/YOUR_SCRIPT_ID`

2. **Verify deployment settings:**
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with Google account" if you prefer)

3. **Test the endpoint directly:**
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?email=test@example.com&name=Test User
   ```
   Should return JSON: `{"success": true, ...}`

### Step 3: Check Browser Console

After signing in, check the browser console (F12) for:
- `[Google Sheets] Attempting to register user...` - Shows registration started
- `[Google Sheets] User registered successfully` - Success!
- `[Google Sheets] Registration failed:` - Error details
- `[Google Sheets] VITE_GOOGLE_APPSCRIPT_URL not configured` - Env var missing

### Step 4: Common Issues

**Issue: CORS Error**
- **Solution**: AppScript web apps handle CORS automatically. If you see CORS errors, check:
  - Deployment is set to "Web app" (not "API Executable")
  - "Who has access" is set to "Anyone"

**Issue: 401 Unauthorized**
- **Solution**: Re-deploy the AppScript with "Anyone" access

**Issue: 404 Not Found**
- **Solution**: Check the AppScript URL is correct and deployment exists

**Issue: No console logs at all**
- **Solution**: 
  1. Check `.env.local` exists and has correct variable name
  2. Restart dev server: `npm run dev`
  3. Check variable is loaded: `console.log(import.meta.env.VITE_GOOGLE_APPSCRIPT_URL)`

### Step 5: Verify Google Sheet Setup

1. **Sheet exists** with correct name (default: "Sheet1")
2. **Headers in Row 1:**
   ```
   timestamp | email | name | initial_credits | browser_info | location_hint | given_name | family_name | referrer | session_id
   ```
3. **Sheet is accessible** (not in a restricted folder)

### Step 6: Test Registration Manually

Open browser console and run:
```javascript
const testUrl = 'YOUR_APPSCRIPT_URL';
const params = new URLSearchParams({
  email: 'test@example.com',
  name: 'Test User',
  timestamp: new Date().toISOString(),
  initial_credits: '5',
  browser_info: 'Chrome on MacIntel',
  location_hint: 'America/New_York'
});

fetch(`${testUrl}?${params.toString()}`)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] `VITE_GOOGLE_APPSCRIPT_URL` is set correctly
- [ ] Dev server was restarted after adding env var
- [ ] AppScript is deployed as "Web app"
- [ ] AppScript access is set to "Anyone"
- [ ] Google Sheet has correct headers
- [ ] Browser console shows registration attempts
- [ ] No CORS errors in console

---

## Still Not Working?

1. **Check network tab** in browser DevTools:
   - Look for request to `script.google.com`
   - Check request URL, status code, response

2. **Enable verbose logging:**
   - Already enabled in `LoginButton.tsx`
   - Check console for detailed error messages

3. **Test AppScript directly:**
   - Use the test URL above
   - Verify it returns success

4. **Check AppScript execution logs:**
   - In AppScript editor: View → Execution log
   - Look for errors during execution

---

## Expected Behavior

When a user signs in:
1. ✅ OAuth completes successfully
2. ✅ User session created in localStorage
3. ✅ Console shows: `[Google Sheets] Attempting to register user...`
4. ✅ Console shows: `[Google Sheets] User registered successfully`
5. ✅ New row appears in Google Sheet

If any step fails, check the console for error messages.

