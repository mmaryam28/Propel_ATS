# UC-135 Security Hardening - Demo Guide

## Overview
This guide shows how to demonstrate all UC-135 security features using your actual application pages (not just the /security test page).

---

## 1. Security Headers (CSP, HSTS, X-Frame-Options, etc.)

### What This Feature Means
HTTP response headers that instruct browsers to enforce security rules like:
- **CSP**: Controls what resources can be loaded (scripts, styles, images)
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks

### How to Demo (Exact Steps)

1. **Start your backend**: `cd backend && npm run start:dev`
2. **Start your frontend**: `cd frontend && npm run dev`
3. **Open any page** in your application (e.g., http://localhost:5173/dashboard)
4. **Open DevTools** (F12)
5. **Go to Network tab**
6. **Reload the page** (Ctrl+R or F5)
7. **Click on any backend API request** (e.g., requests to `localhost:3000`)
8. **Scroll to Response Headers section**

### Headers You Must Point Out

Look for these headers in the Response Headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### Demo Success Criteria
✅ All 5 headers are visible in Response Headers  
✅ You can point to CSP and HSTS live  
✅ Explain what each header does

### Implementation Details
- **File**: `backend/src/main.ts` (lines 13-31)
- **Library**: `helmet` middleware
- **Applied to**: All API responses globally

---

## 2. XSS Protection (Cross-Site Scripting)

### What This Feature Means
User input is sanitized so malicious JavaScript cannot execute. Dangerous HTML tags like `<script>` are stripped or escaped.

### How to Demo (Exact Steps)

#### Option A: Profile Page (Best Demo)
1. **Navigate to Profile page**: http://localhost:5173/profile
2. **Edit your profile** (e.g., bio, name, or any text field)
3. **Paste malicious input**:
   ```html
   <script>alert('XSS Attack!')</script>
   <img src=x onerror="alert('XSS')">
   ```
4. **Save the profile**
5. **Reload the page and view your profile**

**Expected Result**:
- ❌ No alert appears
- ✅ Script tags are stripped or shown as plain text
- ✅ Only safe HTML like `<b>`, `<i>` is allowed

#### Option B: Job Notes/Comments
1. **Go to Jobs page**: http://localhost:5173/jobs
2. **Add a note to any job**:
   ```html
   Test note <script>alert('XSS')</script>
   ```
3. **Save and view the note**

**Expected Result**: Same as above

### Demo Success Criteria
✅ Malicious input visibly fails  
✅ No JavaScript alert executes  
✅ Content is displayed safely as text

### Implementation Details
- **Backend Service**: `backend/src/security/security.service.ts`
- **Method**: `sanitizeInput()` using DOMPurify
- **Integration**: Call `securityService.sanitizeInput()` in controllers that handle user input
- **Allowed Tags**: `<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`

### Quick Integration Example
To add XSS protection to any controller:

```typescript
import { SecurityService } from '../security/security.service';

constructor(private securityService: SecurityService) {}

@Post('create')
async create(@Body() dto: CreateDto) {
  // Sanitize user input
  dto.content = this.securityService.sanitizeInput(dto.content);
  dto.title = this.securityService.sanitizeInput(dto.title);
  
  // Save to database
  return this.service.create(dto);
}
```

---

## 3. CSRF Protection (Cross-Site Request Forgery)

### What This Feature Means
The server rejects state-changing requests (POST, PUT, DELETE) from untrusted origins. This prevents attackers from tricking users into performing unwanted actions.

### How to Demo (Exact Steps)

#### Defense 1: SameSite Cookies (Already Active)

1. **Open DevTools** → **Application tab** → **Cookies**
2. **Look for session cookies**
3. **Show that cookies have `SameSite=Strict`**

**What this means**: Browser won't send cookies with requests from external sites

#### Defense 2: Origin/Referer Validation

1. **Open DevTools** → **Network tab**
2. **Submit any form** (e.g., create a job application)
3. **Click the POST request**
4. **Show Request Headers**:
   ```
   Origin: http://localhost:5173
   Referer: http://localhost:5173/applications
   ```

**What this means**: Server can verify requests come from your app

#### Defense 3: CORS Configuration

1. **Point to main.ts CORS settings**:
   ```typescript
   app.enableCors({
     origin: 'http://localhost:5173',
     credentials: true,
   });
   ```

**What this means**: Only your frontend origin can make authenticated requests

### Demo Success Criteria
✅ Session cookies have `SameSite=Strict`  
✅ CORS is configured to specific origin  
✅ You explain how this prevents CSRF attacks

### Why CSRF Middleware is Disabled
- **Reason**: Your app uses JWT authentication, which is not vulnerable to CSRF (tokens are sent in headers, not cookies)
- **Alternative Protection**: SameSite cookies + CORS + Origin validation provides equivalent protection without breaking existing auth

---

## 4. SQL Injection Prevention

### What This Feature Means
Database queries treat user input as data, not executable SQL. This prevents attackers from manipulating queries to access unauthorized data.

### How to Demo (Exact Steps)

#### Option A: Search/Filter Feature
1. **Navigate to Jobs page**: http://localhost:5173/jobs
2. **Use the search bar** and enter malicious SQL:
   ```sql
   ' OR '1'='1
   '; DROP TABLE users; --
   ' UNION SELECT * FROM users --
   ```
3. **Submit the search**

**Expected Result**:
- ✅ No error/crash
- ✅ No extra data returned
- ✅ Normal search results (or no results)
- ✅ Query treats input as literal text

#### Option B: Job Details by ID
1. **Open any job**: http://localhost:5173/jobs/:id
2. **Modify URL with SQL injection**:
   ```
   http://localhost:5173/jobs/1' OR '1'='1
   ```
3. **Load the page**

**Expected Result**: 404 or normal error (not a SQL error)

### Demo Success Criteria
✅ App does not crash  
✅ No SQL error messages  
✅ Injection attempt is harmless

### Implementation Details
- **Database**: Supabase (PostgreSQL)
- **Protection Method**: **Parameterized queries** (prepared statements)
- **Library**: `@supabase/supabase-js` uses parameterized queries by default

### Example Secure Query (Point to Code)

**Vulnerable Code** (never do this):
```typescript
// ❌ NEVER concatenate user input into SQL
const query = `SELECT * FROM jobs WHERE title = '${userInput}'`;
```

**Secure Code** (Supabase/Prisma):
```typescript
// ✅ User input is automatically parameterized
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('title', userInput); // <- Safe: input is treated as data

// ✅ With Prisma
await prisma.job.findMany({
  where: { title: userInput } // <- Safe: parameterized
});
```

### Defense-in-Depth (Optional)
Show `backend/src/security/security.service.ts`:
```typescript
escapeSQLInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '');
}
```

This provides extra protection, but **parameterized queries are the primary defense**.

---

## 5. Session Security

### What This Feature Means
Session cookies are protected from theft and misuse.

### How to Demo (Exact Steps)

1. **Login to your application**
2. **Open DevTools** → **Application** → **Cookies**
3. **Find session cookie** (look for `connect.sid` or similar)
4. **Point out these flags**:
   - ✅ `HttpOnly`: JavaScript cannot access cookie (prevents XSS theft)
   - ✅ `Secure`: Cookie only sent over HTTPS (in production)
   - ✅ `SameSite=Strict`: Cookie not sent with cross-site requests (prevents CSRF)

### Demo Success Criteria
✅ Session cookie has HttpOnly flag  
✅ Session cookie has SameSite=Strict  
✅ You explain what each flag prevents

### Implementation Details
- **File**: `backend/src/main.ts` (lines 47-60)
- **Settings**:
  ```typescript
  cookie: { 
    httpOnly: true,        // XSS protection
    sameSite: 'strict',    // CSRF protection
    secure: false,         // Set true in production
    maxAge: 86400000,      // 24 hours
  }
  ```

---

## 6. Input Validation

### What This Feature Means
All incoming data is validated against strict rules. Invalid data is rejected before reaching business logic.

### How to Demo (Exact Steps)

1. **Try to create a job application with invalid data**:
   ```json
   {
     "email": "not-an-email",
     "phone": "abc123",
     "unknownField": "malicious data"
   }
   ```
2. **Submit via frontend form or API call**

**Expected Result**:
- ❌ Request rejected with 400 Bad Request
- ✅ Error message: "email must be a valid email"
- ✅ `unknownField` is stripped (whitelist validation)

### Demo Success Criteria
✅ Invalid data is rejected  
✅ Clear error messages  
✅ Unknown fields are stripped

### Implementation Details
- **File**: `backend/src/main.ts` (lines 36-46)
- **Library**: `class-validator` with ValidationPipe
- **Settings**:
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-DTO properties
      transform: true,           // Auto type conversion
      forbidNonWhitelisted: false,
    })
  );
  ```

---

## Summary Checklist

Use this during your demo to ensure you cover everything:

| Feature | Verification Method | Success Criteria |
|---------|-------------------|------------------|
| **Security Headers** | DevTools → Network → Response Headers | CSP, HSTS, X-Frame-Options visible |
| **XSS Protection** | Profile/notes with `<script>` tags | No alert, tags stripped |
| **CSRF Protection** | Show SameSite cookies + CORS | Cookies have SameSite=Strict |
| **SQL Injection** | Search with `' OR '1'='1` | No crash, no extra data |
| **Session Security** | DevTools → Cookies | HttpOnly + SameSite flags set |
| **Input Validation** | Submit invalid data | 400 error with clear message |

---

## Quick Demo Script (5 minutes)

1. **Security Headers** (30 sec)
   - Open DevTools → Network
   - Show CSP, HSTS, X-Frame-Options headers

2. **XSS Protection** (1 min)
   - Go to Profile page
   - Add `<script>alert('XSS')</script>` to bio
   - Save → show no alert appears

3. **CSRF Protection** (1 min)
   - DevTools → Application → Cookies
   - Show `SameSite=Strict` flag
   - Explain CORS + Origin validation

4. **SQL Injection** (1 min)
   - Jobs search bar
   - Enter `' OR '1'='1`
   - Show normal results (no crash)

5. **Session Security** (30 sec)
   - DevTools → Cookies
   - Show HttpOnly + SameSite flags

6. **Input Validation** (1 min)
   - Try invalid email in form
   - Show 400 error message

---

## Troubleshooting

### "I don't see security headers in DevTools"
- Make sure you're looking at **backend API requests** (localhost:3000), not frontend assets
- Headers are on **Response Headers**, not Request Headers
- Try refreshing with cache disabled (Ctrl+Shift+R)

### "XSS test doesn't work (alert still appears)"
- Make sure SecurityService is injected in the controller
- Verify `sanitizeInput()` is called before saving to database
- Check that you're viewing the saved data, not just the form input

### "CSRF test is confusing"
- Focus on **SameSite cookies** and **CORS** as CSRF protections
- Explain that JWT auth (in headers) is not vulnerable to CSRF
- Traditional CSRF tokens are for cookie-based auth only

### "SQL injection test crashes app"
- This means parameterized queries are NOT being used
- Check that you're using Supabase/Prisma query builders
- Never concatenate user input into SQL strings

---

## Files Modified for UC-135

### Backend
- `backend/src/main.ts` - Security middleware (helmet, sessions, CORS, validation)
- `backend/src/security/security.service.ts` - XSS sanitization utilities
- `backend/src/security/security.controller.ts` - Security demo endpoints
- `backend/src/security/security.module.ts` - Security module
- `backend/src/app.module.ts` - Import SecurityModule

### Frontend
- `frontend/src/pages/SecurityDemo.jsx` - Interactive security testing page
- `frontend/src/main.jsx` - Add /security route

### Documentation
- `UC135_SECURITY_HARDENING.md` - Complete technical documentation
- `UC135_SETUP.md` - Quick setup instructions
- `UC135_DEMO_GUIDE.md` - **This file** - Demo presentation guide
