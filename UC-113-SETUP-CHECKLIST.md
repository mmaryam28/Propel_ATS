# UC-113 Quick Setup Checklist

## ✅ Pre-Testing Setup (Do Once)

### 1. Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run `backend/sql/uc113_email_integration.sql`
- [ ] Verify tables created: `gmail_tokens`, `job_emails`

### 2. Google Cloud Console
- [ ] Go to https://console.cloud.google.com/
- [ ] Create/select project
- [ ] Enable Gmail API (APIs & Services > Library)
- [ ] Create OAuth 2.0 credentials (APIs & Services > Credentials)
- [ ] Set application type: Web application
- [ ] Add redirect URI: `http://localhost:5173/gmail-callback`
- [ ] Copy Client ID
- [ ] Copy Client Secret

### 3. Environment Configuration
- [ ] Open `backend/.env`
- [ ] Add these lines:
```env
GMAIL_CLIENT_ID=paste_your_client_id_here
GMAIL_CLIENT_SECRET=paste_your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5173/gmail-callback
```
- [ ] Save file

### 4. Dependencies (Already Installed)
- [x] googleapis package installed
- [x] google-auth-library package installed

### 5. Start Services
- [ ] Backend: `cd backend && npm run start:dev`
- [ ] Frontend: `cd frontend && npm run dev`
- [ ] Wait for both to fully start

## 🧪 Testing Checklist

### Test 1: Gmail Connection
- [ ] Open browser to http://localhost:5173
- [ ] Navigate to any job detail page
- [ ] Scroll to "Email Integration" section
- [ ] See "Connect Gmail Account" button
- [ ] Click button
- [ ] Redirected to Google OAuth page
- [ ] Authorize with read-only access
- [ ] Redirected back to job page
- [ ] See "Search & Link Emails" interface

### Test 2: Email Search
- [ ] Search box shows company name
- [ ] Click "Search" button
- [ ] Emails appear in results
- [ ] Each email shows: sender, subject, date, snippet
- [ ] Status suggestions visible (if applicable)

### Test 3: Link Email
- [ ] Click "Link to Job" on an email
- [ ] Email appears in "Linked Emails" section
- [ ] Email removed from search results
- [ ] Linked email shows all metadata

### Test 4: View Linked Emails
- [ ] Refresh page
- [ ] Linked emails still visible
- [ ] Sorted by date (newest first)
- [ ] Can click X to remove

### Test 5: Disconnect
- [ ] Click "Disconnect Gmail"
- [ ] Returns to "Connect Gmail" view
- [ ] Linked emails remain in database

## 🐛 Troubleshooting

### Issue: "Gmail integration not configured"
- [ ] Check `GMAIL_CLIENT_ID` in backend/.env
- [ ] Check `GMAIL_CLIENT_SECRET` in backend/.env
- [ ] Restart backend server

### Issue: OAuth redirect fails
- [ ] Verify redirect URI exactly matches in Google Console
- [ ] Check frontend running on port 5173
- [ ] Ensure path is `/gmail-callback` (not `/gmail/callback`)

### Issue: "Failed to search emails"
- [ ] Check Gmail API enabled in Google Console
- [ ] Try reconnecting Gmail account
- [ ] Check browser console for errors

### Issue: No emails found
- [ ] Try broader search (just company name)
- [ ] Check you have emails from that company
- [ ] Verify Gmail account used has emails

## 📝 Quick Reference

### API Endpoints
```
GET  /email-integration/auth-url
GET  /email-integration/status
POST /email-integration/connect
DEL  /email-integration/disconnect
GET  /email-integration/search?query=...
POST /email-integration/link
GET  /email-integration/job/:jobId
DEL  /email-integration/unlink/:emailLinkId
```

### Environment Variables
```env
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:5173/gmail-callback
```

### Database Tables
- `gmail_tokens` - OAuth tokens
- `job_emails` - Linked email metadata

## ✨ Success Indicators

You'll know it's working when:
- ✅ Gmail connection succeeds
- ✅ Email search returns results
- ✅ Emails can be linked to jobs
- ✅ Linked emails persist on refresh
- ✅ Status suggestions appear
- ✅ No errors in console

## 🎉 You're Done!

Once all tests pass, the feature is ready to use!
