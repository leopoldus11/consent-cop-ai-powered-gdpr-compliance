# Google AppScript Code for User Registration

Copy this code into your Google Apps Script editor:

```javascript
// Configuration
const SHEET_NAME = 'Sheet1'; // Change if your sheet tab has a different name
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get parameters from either POST body or GET query string
    const params = e.parameter || e.postData ? JSON.parse(e.postData.contents) : {};
    const email = params.email || e.parameter.email;
    
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Email is required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if email already exists (Column B = index 1)
    const data = sheet.getDataRange().getValues();
    const emailColumnIndex = 1; // Column B (0-indexed: A=0, B=1, C=2, etc.)
    let userExists = false;
    
    // Skip header row (index 0), check from row 1 onwards
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailColumnIndex] === email) {
        userExists = true;
        break;
      }
    }
    
    // If user already exists, return success but indicate they're not new
    if (userExists) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'User already registered',
        isNewUser: false
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // User doesn't exist, add them as new user
    const timestamp = params.timestamp || e.parameter.timestamp || new Date().toISOString();
    const name = params.name || e.parameter.name || '';
    const initial_credits = params.initial_credits || e.parameter.initial_credits || '5';
    const browser_info = params.browser_info || e.parameter.browser_info || '';
    const location_hint = params.location_hint || e.parameter.location_hint || '';
    const given_name = params.given_name || e.parameter.given_name || '';
    const family_name = params.family_name || e.parameter.family_name || '';
    const referrer = params.referrer || e.parameter.referrer || 'direct';
    const session_id = params.session_id || e.parameter.session_id || '';
    
    // Append row: timestamp, email, name, initial_credits, browser_info, location_hint
    sheet.appendRow([
      timestamp,
      email,
      name,
      initial_credits,
      browser_info,
      location_hint,
      given_name,
      family_name,
      referrer,
      session_id
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'User registered successfully',
      isNewUser: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Setup Instructions

1. **Create Google Sheet** with these column headers (Row 1):
   ```
   timestamp | email | name | initial_credits | browser_info | location_hint | given_name | family_name | referrer | session_id
   ```

2. **Open Apps Script Editor**:
   - Extensions → Apps Script

3. **Paste the code above**

4. **Deploy as Web App**:
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web app URL

5. **Add URL to `.env.local`**:
   ```env
   VITE_GOOGLE_APPSCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

## Testing

You can test the endpoint directly:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?email=test@example.com&name=Test User
```


