# Google OAuth Setup Instructions

## Current Status
Google OAuth is implemented but needs configuration in Google Console.

## Required Steps

### 1. Google Console Configuration
Go to [Google Cloud Console](https://console.cloud.google.com/):

1. **Create or Select Project**
   - Create a new project or select existing one
   - Enable Google+ API and Google OAuth2 API

2. **Configure OAuth Consent Screen**
   - Go to "OAuth consent screen"
   - Choose "External" user type
   - Fill in application name: "Posty"
   - Add authorized domains: mail-smart-chepuralex1991.replit.app
   - Add your email as a test user if the app is in testing mode

3. **Create OAuth Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Posty Web Client"

4. **Add Redirect URIs**
   Add this exact redirect URI in Google Console:
   ```
   https://mail-smart-chepuralex1991.replit.app/api/auth/google/callback
   ```

### 2. Environment Variables
The following secrets are already configured:
- ✅ GOOGLE_CLIENT_ID 
- ✅ GOOGLE_CLIENT_SECRET

### 3. Current Configuration
The application is now configured to use:
```
https://mail-smart-chepuralex1991.replit.app/api/auth/google/callback
```

This must match exactly in your Google Console OAuth credentials.

## Testing
1. Complete Google Console setup with the exact redirect URI above
2. Try Google sign-in from the login page
3. Check server logs for detailed OAuth flow information
4. Any errors will be logged with specific details for debugging

## Troubleshooting
- **Connection Refused Error**: Check that the authorized domain `mail-smart-chepuralex1991.replit.app` is added to OAuth consent screen
- **Redirect URI Mismatch**: Ensure redirect URI in Google Console exactly matches: `https://mail-smart-chepuralex1991.replit.app/api/auth/google/callback`
- **App in Testing Mode**: Add your email as a test user in the OAuth consent screen
- **API Access**: Verify Google+ API is enabled in your Google Cloud project
- **Client Credentials**: Check that both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are properly set