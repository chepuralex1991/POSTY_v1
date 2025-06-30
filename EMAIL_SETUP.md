# Email Notification Setup Guide

This guide explains how to configure email notifications for new letter uploads in Posty.

## Overview

When a user uploads a new letter, the system will automatically:
1. Process and analyze the document
2. Save it to the database
3. Send an email notification to the user with the document attached

## SMTP Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Configure Environment Variables**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=chepuralex1991@gmail.com
   SMTP_PASS=your-16-character-app-password
   FROM_NAME=Posty
   FROM_EMAIL=chepuralex1991@gmail.com
   ```

### Other SMTP Providers

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false  # or true for port 465
```

## Environment Variables

Add these to your Replit Secrets or `.env` file:

```bash
# Required SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=chepuralex1991@gmail.com
SMTP_PASS=your-app-password

# Email Sender Information
FROM_NAME=Posty
FROM_EMAIL=your_email@gmail.com

# Application URL (for email links)
APP_URL=https://your-app-domain.replit.app
```

## Testing Email Configuration

### 1. Test SMTP Connection
```bash
GET /api/email/test-config
```

Response:
```json
{
  "success": true,
  "message": "Email configuration is valid and SMTP server is reachable."
}
```

### 2. Send Test Email
```bash
POST /api/email/test-send
```

This will send a test email to the authenticated user's email address.

## Email Features

### Automatic Notifications
- **Trigger**: New letter uploaded and processed
- **Recipient**: User who uploaded the letter
- **Subject**: "Your scanned letter from Posty"
- **Attachment**: Original uploaded file (PDF/image)
- **Content**: Document details and dashboard link

### Email Content
- Personalized greeting using user's first name or email
- Document title and processing date
- Link to view in Posty dashboard
- Professional HTML and plain text versions

## Security Considerations

1. **App Passwords**: Use app-specific passwords, never your main account password
2. **Environment Variables**: Store SMTP credentials securely in Replit Secrets
3. **Error Handling**: Email failures won't prevent document upload
4. **File Attachments**: Only includes files that exist and are accessible

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check SMTP_USER and SMTP_PASS are correct
   - Ensure 2FA is enabled and app password is used (Gmail)
   - Verify SMTP_HOST and SMTP_PORT settings

2. **"Connection timeout"**
   - Check SMTP_HOST and SMTP_PORT
   - Try SMTP_SECURE=true with port 465

3. **"File not found" in logs**
   - Check file permissions in uploads directory
   - Verify file paths are correct

4. **Emails not received**
   - Check spam/junk folders
   - Verify FROM_EMAIL is properly configured
   - Test with /api/email/test-send endpoint

### Debug Steps

1. Test SMTP configuration:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-app.replit.app/api/email/test-config
   ```

2. Send test email:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-app.replit.app/api/email/test-send
   ```

3. Check server logs for detailed error messages

## Production Considerations

1. **Rate Limiting**: Gmail has sending limits (500 emails/day for free accounts)
2. **Monitoring**: Set up alerts for email failures
3. **Backup**: Consider multiple SMTP providers for redundancy
4. **Compliance**: Ensure email content complies with privacy regulations

## API Integration

The email service is automatically integrated into the letter upload process. No additional API calls needed.

### Manual Integration Example

```javascript
import { sendLetterNotification } from './email-service';

// After creating a new letter
const user = await storage.getUser(userId);
const letter = await storage.createMailItem(letterData);

// Send notification
await sendLetterNotification(user, {
  id: letter.id,
  title: letter.title,
  fileName: letter.fileName,
  imageUrl: letter.imageUrl,
  uploadDate: letter.uploadDate,
});
```