# UC-145: Security Penetration Testing - Quick Start Guide

## 🚀 5-Minute Setup Guide

This guide will help you quickly set up and run security testing for the Job Application Tracker platform.

---

## Prerequisites

- Node.js 18+ installed
- Docker Desktop running (for OWASP ZAP)
- GitHub repository access
- Supabase database access

---

## Step 1: Database Setup (2 minutes)

### Create Security Tables

```bash
cd backend

# Run the security testing schema
psql $DATABASE_URL < sql/uc145_security_testing.sql
```

Or via Supabase Dashboard:
1. Go to **SQL Editor**
2. Open `sql/uc145_security_testing.sql`
3. Click **Run**

**Verify tables created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'security_%';
```

Expected tables:
- `security_vulnerabilities`
- `security_audit_logs`
- `penetration_test_results`
- `security_scan_results`
- `security_incidents`
- `rate_limit_violations`

---

## Step 2: Install Dependencies (1 minute)

### Backend Security Packages

```bash
cd backend
npm install helmet validator xss express-rate-limit
```

### Testing Tools

```bash
# Install Snyk globally
npm install -g snyk

# Authenticate with Snyk
snyk auth

# Install OWASP ZAP via Docker (optional)
docker pull zaproxy/zap-stable
```

---

## Step 3: Configure Security Middleware (1 minute)

### Update app.module.ts

Open [backend/src/app.module.ts](backend/src/app.module.ts) and add:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SecurityHeadersMiddleware } from './security/security-headers.middleware';
import { RateLimiterMiddleware, AuthRateLimiter } from './security/rate-limiter.middleware';

@Module({
  // ... existing imports
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security headers globally
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // Apply rate limiting to auth routes
    consumer
      .apply(AuthRateLimiter)
      .forRoutes('auth/login', 'auth/register');
  }
}
```

---

## Step 4: Set Up GitHub Secrets (1 minute)

### Required Secrets

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `SNYK_TOKEN` | Snyk API token | `snyk-token-xyz` |
| `DATABASE_URL` | Supabase connection string | `postgresql://...` |
| `STAGING_URL` | Staging environment URL | `https://staging.yourapp.com` |

**Get Snyk Token:**
```bash
snyk auth
# Follow prompts, copy token from https://snyk.io/account
```

---

## Running Security Tests

### Automated Tests (Daily via GitHub Actions)

The security scan workflow runs automatically:
- **Daily** at 3:00 AM UTC
- **On every PR**
- **On pushes to main**

**Manual trigger:**
1. Go to **Actions** tab
2. Select **Security Scanning**
3. Click **Run workflow**

---

### Manual Penetration Testing

#### Quick OWASP Top 10 Test

```bash
cd backend

# Run automated security tests
npm run test:e2e test/security/owasp-top10.e2e-spec.ts
```

#### Run OWASP ZAP Scan

```bash
# Using Docker
docker run -v $(pwd):/zap/wrk/:rw \
  -t zaproxy/zap-stable zap-baseline.py \
  -t https://staging.yourapp.com \
  -r zap-report.html

# View report
open zap-report.html
```

#### Run Dependency Scan

```bash
cd backend
npm audit --audit-level=moderate

# Or with Snyk
snyk test
```

---

### Check Rate Limiting

```bash
# Test authentication rate limit (5 requests per 15 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Expected: 6th request returns 429 Too Many Requests
```

---

### Verify Security Headers

```bash
curl -I http://localhost:3000/api/health

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

---

## Interpreting Results

### GitHub Actions Security Report

After workflow runs:
1. Go to **Actions** → **Security Scanning** → Latest run
2. Check job statuses:
   - ✅ Green: No issues found
   - ⚠️ Yellow: Warnings (review recommended)
   - ❌ Red: Vulnerabilities found (action required)
3. Download artifacts:
   - `security-summary.md` - Executive summary
   - `npm-audit-backend.json` - Backend dependencies
   - `zap-report.html` - OWASP ZAP findings

---

### Understanding Severity Levels

| Severity | Priority | Action Required | SLA |
|----------|----------|-----------------|-----|
| **Critical** | P0 | Immediate fix | 24 hours |
| **High** | P1 | Fix this sprint | 7 days |
| **Medium** | P2 | Fix next sprint | 30 days |
| **Low** | P3 | Backlog | 90 days |
| **Info** | P4 | No action needed | - |

---

### Sample Security Report

```markdown
## Security Scan Results - Dec 16, 2025

### Summary
- ✅ Dependency Scan: PASSED (0 critical, 2 moderate)
- ⚠️ OWASP ZAP: WARNINGS (3 medium issues)
- ✅ Secrets Scan: PASSED (no secrets found)
- ✅ Security Headers: PASSED (all headers present)

### Critical Issues: 0
### High Issues: 0
### Medium Issues: 3

1. **Missing Content-Security-Policy on /api/admin**
   - Severity: Medium
   - Fix: Add CSP header to admin routes
   - ETA: 2 hours

2. **Weak Password Policy**
   - Severity: Medium  
   - Fix: Enforce 12+ characters
   - ETA: 4 hours

3. **Session Timeout Not Configured**
   - Severity: Medium
   - Fix: Set JWT expiry to 24h
   - ETA: 1 hour

### Actions Required:
- [ ] Fix medium issues by Dec 18
- [ ] Update moderate dependencies
- [ ] Schedule penetration test for Dec 20
```

---

## Common Issues & Solutions

### Issue: `npm audit` reports vulnerabilities

**Solution:**
```bash
# Update dependencies
npm update

# Force update if needed
npm audit fix --force

# Check again
npm audit
```

---

### Issue: Rate limiting not working

**Solution:**
1. Verify middleware is applied:
   ```typescript
   // app.module.ts
   consumer.apply(AuthRateLimiter).forRoutes('auth/*');
   ```
2. Check Redis connection (if using Redis)
3. Restart server: `npm run start:dev`

---

### Issue: OWASP ZAP false positives

**Solution:**
1. Edit `.zap/rules.tsv`
2. Add ignore rule:
   ```
   IGNORE_SCANNER	URL	.*\/false-positive-endpoint.*
   ```
3. Re-run scan

---

### Issue: Security headers missing

**Solution:**
1. Verify middleware order in `app.module.ts`:
   ```typescript
   consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
   ```
2. Check middleware is imported correctly
3. Restart server

---

## Next Steps

### 1. Review Manual Testing Guide
Read [PENETRATION-TESTING-GUIDE.md](backend/test/security/PENETRATION-TESTING-GUIDE.md) for step-by-step manual tests.

### 2. Schedule Regular Tests
- **Weekly**: Run OWASP Top 10 tests
- **Monthly**: Full penetration test
- **Quarterly**: External security audit

### 3. Document Vulnerabilities
Use `security_vulnerabilities` table:
```sql
INSERT INTO security_vulnerabilities (
  title, description, severity, category, status
) VALUES (
  'XSS in Job Description',
  'User input not sanitized in job description field',
  'high',
  'xss',
  'open'
);
```

### 4. Set Up Monitoring
- Enable security audit logs
- Configure alerts for critical issues
- Review logs weekly

---

## Resources

### Documentation
- [SECURITY.md](SECURITY.md) - Security policy
- [PENETRATION-TESTING-GUIDE.md](backend/test/security/PENETRATION-TESTING-GUIDE.md) - Manual testing
- [.github/workflows/security-scan.yml](.github/workflows/security-scan.yml) - CI/CD workflow

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Snyk Documentation](https://docs.snyk.io/)
- [ZAP Documentation](https://www.zaproxy.org/docs/)

### Security Contacts
- **Security Team**: security@yourcompany.com
- **Incident Response**: security-incident@yourcompany.com (24/7)
- **General Questions**: GitHub Issues

---

## Checklist

**Initial Setup:**
- [ ] Database tables created
- [ ] Dependencies installed
- [ ] Security middleware configured
- [ ] GitHub secrets added
- [ ] First security scan run

**Weekly Tasks:**
- [ ] Review security scan results
- [ ] Check dependency vulnerabilities
- [ ] Test rate limiting
- [ ] Review security audit logs

**Monthly Tasks:**
- [ ] Run full penetration tests
- [ ] Update security documentation
- [ ] Review and close resolved vulnerabilities
- [ ] Team security training

**Quarterly Tasks:**
- [ ] External security audit
- [ ] Review and update security policies
- [ ] Disaster recovery drill
- [ ] Security compliance review

---

**Need Help?**
- 📧 Email: security@yourcompany.com
- 💬 Slack: #security-team
- 📚 Docs: /docs/security/

**Version:** 1.0  
**Last Updated:** December 16, 2025
