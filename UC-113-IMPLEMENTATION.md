# UC-113: Email Integration for Application Tracking

## Overview
This feature allows users to connect their Gmail account and manually link emails to job applications, keeping all communication in one place.

## Features Implemented

### Backend
1. **Email Integration Module** (`backend/src/email-integration/`)
   - Gmail OAuth 2.0 authentication (read-only access)
   - Email search functionality
   - Link/unlink emails to job applications
   - Store email metadata in database
   - Automatic status suggestion based on email content

2. **Database Schema** (`backend/sql/uc113_email_integration.sql`)
   - `gmail_tokens` table: Stores OAuth tokens per user
   - `job_emails` table: Stores linked email metadata
   - Indexes for performance optimization

3. **API Endpoints**
   - `GET /email-integration/auth-url` - Get Gmail OAuth URL
   - `GET /email-integration/status` - Check connection status
   - `POST /email-integration/connect` - Connect Gmail account
   - `DELETE /email-integration/disconnect` - Disconnect Gmail
   - `GET /email-integration/search` - Search emails
   - `POST /email-integration/link` - Link email to job
   - `GET /email-integration/job/:jobId` - Get linked emails
   - `DELETE /email-integration/unlink/:emailLinkId` - Unlink email

### Frontend
1. **EmailIntegration Component** (`frontend/src/components/EmailIntegration.jsx`)
   - Gmail connection UI
   - Email search with auto-populated company name
   - Email preview with status suggestions
   - Link/unlink functionality
   - Displays linked emails chronologically

2. **Gmail Callback Page** (`frontend/src/pages/GmailCallback.jsx`)
   - Handles OAuth redirect
   - Processes authorization code
   - Returns user to job page

3. **Integration Points**
   - Added to JobDetails page
   - Auto-searches emails when viewing job
   - Shows keyword-based status suggestions (Interview, Offer, Rejection, Applied)

## Setup Instructions

### 1. Database Setup
Run the SQL migration in your Supabase SQL editor:
```bash
# Execute the file:
backend/sql/uc113_email_integration.sql
```

### 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:5173/gmail-callback` (development)
     - `https://your-production-domain.com/gmail-callback` (production)
   - Copy the Client ID and Client Secret

### 3. Environment Variables
Add to `backend/.env`:
```env
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_google_client_id_here
GMAIL_CLIENT_SECRET=your_google_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5173/gmail-callback
```

### 4. Install Dependencies
Already installed via:
```bash
cd backend
npm install googleapis google-auth-library
```

### 5. Start Services
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

## Testing Guide

### 1. Connect Gmail Account
1. Navigate to any job detail page (`/jobs/:jobId`)
2. Scroll to the "Email Integration" section
3. Click "Connect Gmail Account"
4. Authorize the application (read-only access)
5. You'll be redirected back to the job page

### 2. Search and Link Emails
1. The search box is auto-populated with the company name
2. Click "Search" to find emails
3. Review search results with status suggestions
4. Click "Link to Job" on relevant emails
5. Linked emails appear in the "Linked Emails" section

### 3. View Linked Emails
1. Linked emails display chronologically
2. Each shows:
   - Sender name/email
   - Subject
   - Date received
   - Email preview snippet
   - Suggested status (if applicable)
3. Click "X" to remove linked email

### 4. Disconnect Gmail
1. Click "Disconnect Gmail" button
2. This removes stored tokens
3. Linked emails remain in database

## Privacy & Security

### User Privacy
- **Opt-in only**: Users must explicitly connect Gmail
- **Read-only access**: App cannot send emails or modify Gmail
- **Minimal scope**: Only requests `gmail.readonly` permission
- **Stored data**: Only email metadata (no content/attachments)
- **User control**: Can disconnect anytime

### Security Features
- OAuth 2.0 authentication
- Refresh tokens for long-term access
- Token expiry handling
- Environment-based configuration
- No hardcoded credentials

### Rate Limiting
- Gmail API has free tier limits:
  - 250 quota units/user/second
  - 1 billion quota units/day
- Search operations use minimal quota
- Caching email metadata reduces API calls

## Status Suggestions

The system suggests job application status based on email keywords:

| Keywords | Suggested Status | Color |
|----------|-----------------|-------|
| interview, schedule, meeting, zoom, teams, call | Interview | Blue |
| offer, congratulations, welcome aboard | Offer | Green |
| reject, regret, unfortunately, not moving forward | Rejected | Red |
| application received, thank you for applying | Applied | Yellow |

## Files Changed/Created

### Backend
- ✅ `backend/sql/uc113_email_integration.sql` - Database schema
- ✅ `backend/src/email-integration/email-integration.module.ts` - NestJS module
- ✅ `backend/src/email-integration/email-integration.service.ts` - Business logic
- ✅ `backend/src/email-integration/email-integration.controller.ts` - API endpoints
- ✅ `backend/src/email-integration/dto/email-integration.dto.ts` - TypeScript DTOs
- ✅ `backend/src/app.module.ts` - Added EmailIntegrationModule import
- ✅ `backend/package.json` - Added googleapis dependencies

### Frontend
- ✅ `frontend/src/components/EmailIntegration.jsx` - Main component
- ✅ `frontend/src/pages/GmailCallback.jsx` - OAuth callback handler
- ✅ `frontend/src/lib/api.ts` - Added email integration API functions
- ✅ `frontend/src/main.jsx` - Added /gmail-callback route
- ✅ `frontend/src/pages/JobDetails.jsx` - Integrated EmailIntegration component

## Troubleshooting

### "Gmail integration not configured" error
- Check that `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` are set in `backend/.env`
- Restart the backend server after adding environment variables

### OAuth redirect doesn't work
- Verify redirect URI in Google Cloud Console matches exactly
- Check that frontend is running on the specified port (default: 5173)
- Ensure redirect URI includes `/gmail-callback` path

### "Failed to search emails" error
- User may need to reconnect Gmail (token expired)
- Check Gmail API is enabled in Google Cloud Console
- Verify API quotas aren't exceeded

### Emails not appearing
- Check search query matches email content
- Try broader search terms (just company name)
- Verify user has emails from that company

## Future Enhancements
- Automatic email discovery based on job applications
- Email thread viewing
- Attachment preview
- Email tagging/categorization
- Bulk linking of emails
- Integration with other email providers (Outlook, Yahoo)
