# Security Package Installation Commands

## Required Dependencies

Run these commands to install all security-related packages for UC-145:

### Backend Security Packages

```bash
cd backend

# Core security packages
npm install helmet@^7.1.0      # Security headers middleware
npm install validator@^13.11.0  # Input validation utilities
npm install xss@^1.0.14         # XSS sanitization
```

### Optional Testing Tools

```bash
# Install globally for security testing
npm install -g snyk            # Vulnerability scanning
npm install -g @zaproxy/zap    # OWASP ZAP CLI (optional)
```

### Verify Installation

```bash
npm list helmet validator xss
```

Expected output:
```
backend@1.0.0
├── helmet@7.1.0
├── validator@13.11.0
└── xss@1.0.14
```

---

## What Each Package Does

### helmet (Security Headers)
- Sets secure HTTP headers
- Used by: `security-headers.middleware.ts`
- Prevents: XSS, clickjacking, MIME sniffing

### validator (Input Validation)
- Validates and sanitizes strings
- Used by: `input-validator.ts`
- Prevents: SQL injection, XSS, SSRF

### xss (XSS Prevention)
- Sanitizes HTML and prevents XSS attacks
- Used by: `input-validator.ts`
- Prevents: Cross-site scripting

---

## Installation Steps

1. Navigate to backend folder
2. Run npm install commands
3. Verify packages installed
4. Restart development server

```bash
cd c:\Users\domen\Documents\CS490-Project\backend
npm install helmet validator xss
npm run start:dev
```

---

## Troubleshooting

### Issue: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript errors
```bash
# Install type definitions
npm install --save-dev @types/validator
```

### Issue: Version conflicts
```bash
# Check for conflicts
npm ls helmet validator xss

# Use specific versions if needed
npm install helmet@7.1.0 --save-exact
```

---

## After Installation

Run these commands to verify security features work:

```bash
# Start server
npm run start:dev

# Test security headers (in new terminal)
curl -I http://localhost:3000/api/health

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

---

## Next Steps

After installing packages:

1. ✅ Run database migrations: `psql $DATABASE_URL < sql/uc145_security_testing.sql`
2. ✅ Restart development server: `npm run start:dev`
3. ✅ Run security tests: `npm run test:e2e test/security/owasp-top10.e2e-spec.ts`
4. ✅ Check GitHub Actions: Enable security-scan.yml workflow

See [UC-145-QUICK-START.md](UC-145-QUICK-START.md) for complete setup guide.
