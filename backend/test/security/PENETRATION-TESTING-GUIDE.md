# Manual Penetration Testing Guide

## UC-145: Security Penetration Testing

This guide provides step-by-step procedures for conducting manual security penetration testing on the Job Application Tracker platform.

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [OWASP Top 10 Testing](#owasp-top-10-testing)
3. [Additional Security Tests](#additional-security-tests)
4. [Post-Testing Procedures](#post-testing-procedures)
5. [Tools & Resources](#tools--resources)

---

## Pre-Testing Setup

### Environment Preparation

**✅ Prerequisites:**
- Access to staging environment
- Test user accounts (admin, regular user)
- API documentation
- Testing tools installed (Burp Suite, Postman, curl)

**⚙️ Setup Steps:**

1. **Configure Testing Environment**
   ```bash
   export API_BASE_URL="https://staging.yourapp.com/api"
   export TEST_USER_EMAIL="test@example.com"
   export TEST_USER_PASSWORD="TestPassword123!"
   export ADMIN_EMAIL="admin@example.com"
   export ADMIN_PASSWORD="AdminPassword123!"
   ```

2. **Obtain Authentication Tokens**
   ```bash
   # Get regular user token
   curl -X POST $API_BASE_URL/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"

   # Save token
   export AUTH_TOKEN="<token-from-response>"
   ```

3. **Document Test Environment**
   - Date/Time of testing
   - Environment (staging/production)
   - Tester name
   - Tools used
   - Scope of testing

---

## OWASP Top 10 Testing

### A01: Broken Access Control

#### Test 1: Unauthorized Endpoint Access
**Objective:** Verify protected endpoints require authentication

```bash
# Test without token
curl -X GET $API_BASE_URL/jobs -v

# Expected: 401 Unauthorized
```

**✅ Pass Criteria:** Returns 401 status code  
**❌ Fail Criteria:** Returns data without authentication

---

#### Test 2: Horizontal Privilege Escalation
**Objective:** Prevent accessing other users' resources

1. Create two test users (User A, User B)
2. As User A, create a job application (note the ID)
3. As User B, try to access User A's application

```bash
# As User B
curl -X GET $API_BASE_URL/applications/<USER_A_APPLICATION_ID> \
  -H "Authorization: Bearer $USER_B_TOKEN" -v

# Expected: 403 Forbidden
```

**✅ Pass Criteria:** Returns 403 Forbidden  
**❌ Fail Criteria:** Returns User A's data to User B

---

#### Test 3: Vertical Privilege Escalation
**Objective:** Prevent regular users from accessing admin functions

```bash
# As regular user
curl -X GET $API_BASE_URL/admin/users \
  -H "Authorization: Bearer $AUTH_TOKEN" -v

# Expected: 403 Forbidden
```

**✅ Pass Criteria:** Returns 403 Forbidden  
**❌ Fail Criteria:** Returns admin data to regular user

---

### A02: Cryptographic Failures

#### Test 4: HTTPS Enforcement
**Objective:** Verify all traffic uses HTTPS

```bash
# Try HTTP (should redirect to HTTPS)
curl -X GET http://staging.yourapp.com/api/health -v

# Expected: 301/302 redirect to HTTPS
```

**✅ Pass Criteria:** Redirects to HTTPS or refuses connection  
**❌ Fail Criteria:** Serves content over HTTP

---

#### Test 5: Sensitive Data Exposure
**Objective:** Ensure passwords/secrets not exposed in responses

```bash
# Get user profile
curl -X GET $API_BASE_URL/auth/me \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Check response for:
# - password, passwordHash, secret, apiKey
```

**✅ Pass Criteria:** No sensitive fields in response  
**❌ Fail Criteria:** Response contains password hashes or secrets

---

### A03: Injection

#### Test 6: SQL Injection - Search
**Objective:** Test for SQL injection vulnerabilities

**Payloads to test:**
```bash
# Basic OR bypass
curl -X GET "$API_BASE_URL/jobs?search=' OR '1'='1" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# UNION-based
curl -X GET "$API_BASE_URL/jobs?search=1' UNION SELECT * FROM users--" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Time-based blind
curl -X GET "$API_BASE_URL/jobs?search=1' AND SLEEP(5)--" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Comment-based
curl -X GET "$API_BASE_URL/jobs?search=1'; DROP TABLE jobs; --" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**✅ Pass Criteria:**
- Returns error or empty results
- Response time < 1 second (for time-based test)
- Database remains intact

**❌ Fail Criteria:**
- Returns unauthorized data
- Database modified or dropped
- Response time > 5 seconds (indicates time-based injection)

---

#### Test 7: XSS - Stored
**Objective:** Prevent stored cross-site scripting

**Payloads to test:**
```bash
# Script tag
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<script>alert(\"XSS\")</script>",
    "company": "Test Company",
    "description": "Test"
  }'

# Image onerror
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "<img src=x onerror=alert(\"XSS\")>",
    "description": "Test"
  }'

# Event handler
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "Test",
    "description": "<div onmouseover=alert(\"XSS\")>hover me</div>"
  }'
```

**Verification:**
1. Create job with payload
2. Retrieve the job
3. Check if payload is sanitized or escaped

**✅ Pass Criteria:**
- Payload rejected (400 Bad Request), OR
- Payload sanitized/escaped in response (e.g., `&lt;script&gt;`)

**❌ Fail Criteria:**
- Raw payload stored and returned

---

#### Test 8: XSS - Reflected
**Objective:** Prevent reflected XSS in URL parameters

```bash
# Test error messages
curl -X GET "$API_BASE_URL/jobs?error=<script>alert('XSS')</script>" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Test search reflection
curl -X GET "$API_BASE_URL/jobs?search=<img src=x onerror=alert('XSS')>" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**✅ Pass Criteria:** Payloads escaped in response  
**❌ Fail Criteria:** Raw script executed or reflected

---

### A04: Insecure Design

#### Test 9: Password Strength
**Objective:** Enforce strong password requirements

**Weak passwords to test:**
```bash
# Too short
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "1234567",
    "firstname": "Test",
    "lastname": "User"
  }'

# No uppercase
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123!",
    "firstname": "Test",
    "lastname": "User"
  }'

# No special char
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com",
    "password": "Password123",
    "firstname": "Test",
    "lastname": "User"
  }'

# Common password
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test4@example.com",
    "password": "Password123!",
    "firstname": "Test",
    "lastname": "User"
  }'
```

**✅ Pass Criteria:** All weak passwords rejected with 400 Bad Request  
**❌ Fail Criteria:** Weak password accepted

---

#### Test 10: Account Lockout
**Objective:** Prevent brute force attacks

```bash
# Attempt 6+ failed logins
for i in {1..7}; do
  curl -X POST $API_BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"WrongPassword$i\"}" \
    -v
  echo "Attempt $i"
done

# Expected: 429 Too Many Requests after 5 attempts
```

**✅ Pass Criteria:** Account locked after 5 attempts (429 status)  
**❌ Fail Criteria:** Unlimited login attempts allowed

---

### A05: Security Misconfiguration

#### Test 11: Security Headers
**Objective:** Verify security headers are present

```bash
curl -X GET $API_BASE_URL/health -I

# Check for headers:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security: max-age=31536000
# - Content-Security-Policy: (restrictive policy)
```

**✅ Pass Criteria:** All security headers present with correct values  
**❌ Fail Criteria:** Missing or weak security headers

---

#### Test 12: Error Information Disclosure
**Objective:** Prevent exposing sensitive error details

```bash
# Trigger errors
curl -X GET $API_BASE_URL/nonexistent -v
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "invalid json" -v

# Check responses for:
# - Stack traces
# - Database errors
# - Internal paths
# - Version numbers
```

**✅ Pass Criteria:** Generic error messages only  
**❌ Fail Criteria:** Stack traces, paths, or DB errors exposed

---

#### Test 13: Server Information Disclosure
**Objective:** Prevent exposing server/framework details

```bash
curl -X GET $API_BASE_URL/health -I | grep -i "server\|x-powered-by"

# Expected: Headers should be absent or generic
```

**✅ Pass Criteria:** No `X-Powered-By` or detailed `Server` header  
**❌ Fail Criteria:** Headers reveal Express, NestJS, or version info

---

### A06: Vulnerable and Outdated Components

#### Test 14: Dependency Vulnerabilities
**Objective:** Check for known vulnerable dependencies

```bash
# Run npm audit
cd backend
npm audit

# Run Snyk scan
snyk test

# Expected: No high/critical vulnerabilities
```

**✅ Pass Criteria:** No high/critical vulnerabilities  
**❌ Fail Criteria:** High/critical vulnerabilities present

---

### A07: Identification and Authentication Failures

#### Test 15: JWT Token Validation
**Objective:** Ensure proper JWT validation

```bash
# Invalid signature
curl -X GET $API_BASE_URL/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalid" -v

# Expected: 401 Unauthorized
```

**✅ Pass Criteria:** Rejects invalid tokens with 401  
**❌ Fail Criteria:** Accepts invalid tokens

---

#### Test 16: Session Management
**Objective:** Verify token expiration

```bash
# Get token
TOKEN=$(curl -s -X POST $API_BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
  | jq -r '.accessToken')

# Wait for token expiration (or modify token exp claim)
# Then try using expired token
curl -X GET $API_BASE_URL/jobs \
  -H "Authorization: Bearer $TOKEN" -v

# Expected: 401 after expiration
```

**✅ Pass Criteria:** Expired tokens rejected  
**❌ Fail Criteria:** Expired tokens still work

---

### A08: Software and Data Integrity Failures

#### Test 17: File Upload Type Validation
**Objective:** Prevent malicious file uploads

```bash
# Upload executable
curl -X POST $API_BASE_URL/resume/upload \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@malicious.exe" -v

# Upload script
curl -X POST $API_BASE_URL/resume/upload \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@script.sh" -v

# Expected: 400 Bad Request (invalid file type)
```

**✅ Pass Criteria:** Rejects non-PDF/DOCX files with 400  
**❌ Fail Criteria:** Accepts executable files

---

#### Test 18: File Size Validation
**Objective:** Prevent denial-of-service via large files

```bash
# Create 20MB file
dd if=/dev/zero of=large.pdf bs=1M count=20

# Upload large file
curl -X POST $API_BASE_URL/resume/upload \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@large.pdf" -v

# Expected: 400 Bad Request (file too large)
```

**✅ Pass Criteria:** Rejects files > 10MB with 400  
**❌ Fail Criteria:** Accepts files of unlimited size

---

### A09: Security Logging and Monitoring Failures

#### Test 19: Security Event Logging
**Objective:** Verify security events are logged

**Events to verify:**
- Failed login attempts
- Unauthorized access attempts
- Suspicious activity

**Check logs:**
```bash
# Query security_audit_logs table
SELECT * FROM security_audit_logs 
WHERE "eventType" = 'failed_login'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**✅ Pass Criteria:** Security events logged with details (IP, timestamp, user)  
**❌ Fail Criteria:** Security events not logged

---

### A10: Server-Side Request Forgery (SSRF)

#### Test 20: SSRF in URL Parameters
**Objective:** Prevent SSRF attacks

**Payloads to test:**
```bash
# Localhost
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "Test",
    "url": "http://localhost:3000/admin"
  }'

# Internal IP
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "Test",
    "url": "http://192.168.1.1"
  }'

# AWS metadata
curl -X POST $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "company": "Test",
    "url": "http://169.254.169.254/latest/meta-data/"
  }'

# Expected: 400 Bad Request (invalid URL)
```

**✅ Pass Criteria:** Rejects internal/localhost URLs with 400  
**❌ Fail Criteria:** Accepts internal URLs

---

## Additional Security Tests

### CSRF Protection

#### Test 21: CSRF Token Enforcement
**Objective:** Prevent cross-site request forgery

**Manual Test:**
1. Create HTML page with malicious form:
   ```html
   <form action="https://staging.yourapp.com/api/jobs" method="POST">
     <input name="title" value="Malicious Job">
     <input name="company" value="Evil Corp">
   </form>
   <script>document.forms[0].submit();</script>
   ```
2. Host page on different domain
3. Open page while logged into application
4. Verify request is blocked

**✅ Pass Criteria:** CSRF attack blocked (403 Forbidden)  
**❌ Fail Criteria:** Request succeeds cross-origin

---

### Rate Limiting

#### Test 22: Rate Limit Enforcement
**Objective:** Prevent API abuse

```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl -X GET $API_BASE_URL/jobs \
    -H "Authorization: Bearer $AUTH_TOKEN" &
done
wait

# Expected: Some requests return 429 Too Many Requests
```

**✅ Pass Criteria:** Rate limit enforced (429 after threshold)  
**❌ Fail Criteria:** Unlimited requests allowed

---

#### Test 23: Rate Limit Headers
**Objective:** Verify rate limit headers present

```bash
curl -X GET $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" -I

# Check for:
# - X-RateLimit-Limit: 60
# - X-RateLimit-Remaining: 59
# - X-RateLimit-Reset: <timestamp>
```

**✅ Pass Criteria:** Rate limit headers present  
**❌ Fail Criteria:** Headers missing

---

### Content Security Policy

#### Test 24: CSP Header Validation
**Objective:** Verify restrictive CSP

```bash
curl -X GET https://staging.yourapp.com -I | grep -i "content-security-policy"

# Expected: Restrictive policy (no unsafe-inline, no unsafe-eval)
```

**✅ Pass Criteria:** CSP present and restrictive  
**❌ Fail Criteria:** CSP missing or allows unsafe-inline

---

### API Security

#### Test 25: API Versioning
**Objective:** Verify API version handling

```bash
# Old version
curl -X GET $API_BASE_URL/v1/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" -v

# No version
curl -X GET $API_BASE_URL/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" -v

# Expected: Consistent behavior or proper deprecation notice
```

**✅ Pass Criteria:** Versions handled properly  
**❌ Fail Criteria:** Version confusion or errors

---

## Post-Testing Procedures

### Document Findings

**For Each Vulnerability Found:**

1. **Severity Assessment**
   - Critical: Immediate system compromise
   - High: Significant data exposure
   - Medium: Limited impact or requires user interaction
   - Low: Minimal impact

2. **CVSS Scoring**
   - Use [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
   - Document CVSS vector string

3. **Evidence Collection**
   - Screenshot of vulnerability
   - Request/response logs
   - Reproduction steps

4. **Report Template**
   ```markdown
   ## Vulnerability: [Title]
   
   **Severity:** [Critical/High/Medium/Low]
   **CVSS Score:** [Score] ([Vector])
   **OWASP Category:** [A01-A10]
   
   ### Description
   [What is the vulnerability?]
   
   ### Impact
   [What can an attacker do?]
   
   ### Reproduction Steps
   1. Step 1
   2. Step 2
   3. ...
   
   ### Proof of Concept
   ```bash
   [Commands/code to reproduce]
   ```
   
   ### Remediation
   [How to fix it]
   
   ### References
   - [CWE link]
   - [OWASP guide]
   ```

### Report Submission

1. **Create Security Advisory**
   - Go to GitHub Security tab
   - Create private security advisory
   - Fill in details

2. **Notify Security Team**
   - Email: security@yourcompany.com
   - Include report PDF
   - Reference GitHub advisory

3. **Track Remediation**
   - Add to `security_vulnerabilities` table
   - Assign owner
   - Set remediation deadline

---

## Tools & Resources

### Testing Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Burp Suite** | Web proxy, scanner | [Download](https://portswigger.net/burp) |
| **OWASP ZAP** | Security scanner | [Download](https://www.zaproxy.org/) |
| **Postman** | API testing | [Download](https://www.postman.com/) |
| **curl** | Command-line HTTP | Pre-installed (Linux/Mac) |
| **sqlmap** | SQL injection | `pip install sqlmap` |
| **nikto** | Web scanner | `apt install nikto` |

### Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackerOne Hacktivity](https://hackerone.com/hacktivity)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

### Checklist

**Before Testing:**
- [ ] Authorization obtained
- [ ] Test environment confirmed (not production)
- [ ] Test accounts created
- [ ] Tools installed and configured
- [ ] Documentation ready

**During Testing:**
- [ ] Follow responsible disclosure
- [ ] Document all findings
- [ ] Collect evidence (screenshots, logs)
- [ ] Note false positives
- [ ] Track time spent per test

**After Testing:**
- [ ] Generate report
- [ ] Submit vulnerabilities
- [ ] Clean up test data
- [ ] Deactivate test accounts
- [ ] Archive evidence securely

---

**Document Version:** 1.0  
**Last Updated:** December 16, 2025  
**Next Review:** March 16, 2026
