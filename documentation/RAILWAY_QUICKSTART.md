# Railway Deployment Quick Reference

## Terminal Commands (Run These First)

```bash
# 1. Navigate to project
cd C:\Users\ld403\Downloads\CS490\CS490-Project

# 2. (Optional) Test Docker build locally
docker build -t propel-backend -f backend/Dockerfile backend/

# 3. (Optional) Test Docker run locally
docker run -p 3000:3000 --env-file backend/.env propel-backend

# 4. Commit and push deployment files
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

## Railway UI Steps (Do These Second)

### 1. Initial Setup
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Authorize Railway

### 2. Create Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `Khalid-Itani/CS490-Project`

### 3. Configure Service
- [ ] Go to Settings
- [ ] Set "Root Directory" = `backend`
- [ ] Save changes

### 4. Set Environment Variables
Go to "Variables" tab and add:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
APP_NAME=Propel
EMAIL_FROM=Propel <propel.resumeai@gmail.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=propel.resumeai@gmail.com
SMTP_PASS=ataosmofsfjwturd
SUPABASE_URL=https://isnkdobfeftngvxwtrve.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=a3b70878070729d1e976aaef82cf5dffcff78cff816988f7ded30863533a4786f34e7e3f1fdbd9c15dcadbddfe2f78deba7913392ab25245a7131f82001bfafc
JWT_EXPIRES_IN=7d
LINKEDIN_CLIENT_ID=78cc8f4w30tfff
LINKEDIN_CLIENT_SECRET=WPL_AP1.jYT3xzH13rjKnW7s.XspyIw==
OPENAI_API_KEY=your-openai-key
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=phi3
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3NjYwMDc2MTAuNTU1ODc2...
```

### 5. Generate Domain
- [ ] Go to Settings → Networking → Public Networking
- [ ] Click "Generate Domain"
- [ ] Copy the domain (e.g., `propel-backend-xyz.up.railway.app`)

### 6. Update Callback URLs
Add these with YOUR Railway domain:

```env
LINKEDIN_REDIRECT_URI=https://YOUR-DOMAIN.railway.app/linkedin-auth/callback
LINKEDIN_CALLBACK_URL=https://YOUR-DOMAIN.railway.app/auth/linkedin/callback
```

### 7. Wait for Deploy
- [ ] Go to "Deployments" tab
- [ ] Wait for "Success" status
- [ ] Check logs for errors

## Verification Steps

### 1. Test Health Endpoint
```bash
curl https://your-domain.railway.app/health
```

Expected:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-12-17...",
  "environment": "production"
}
```

### 2. Test Root Endpoint
```bash
curl https://your-domain.railway.app/
```

### 3. Check Logs
- [ ] Open Railway dashboard
- [ ] Click your service
- [ ] View "Logs" tab
- [ ] Look for: `🚀 Application is running on port XXXX`

### 4. Test a Protected Endpoint
Try logging in through your frontend connected to the Railway backend.

## Common Issues

### "Build failed"
→ Check Deployments → Build Logs
→ Usually TypeScript compilation error

### "Service unavailable"
→ Check Logs tab
→ Usually missing environment variable or database connection issue

### "CORS error" in browser
→ Verify `FRONTEND_URL` is set correctly
→ Check it matches your actual frontend domain

### "Port already in use" (local testing)
→ Another app is using port 3000
→ Kill the process or use different port

## File Checklist

Created/modified these files:
- [x] `backend/Dockerfile`
- [x] `backend/.dockerignore`
- [x] `backend/.env.example`
- [x] `railway.json`
- [x] `backend/src/main.ts` (updated PORT handling)
- [x] `backend/src/app.controller.ts` (added health checks)
- [x] `RAILWAY_DEPLOYMENT.md` (full guide)
- [x] `RAILWAY_QUICKSTART.md` (this file)

## Next Steps After Backend Deployed

1. **Deploy Frontend**
   - Use Vercel or Railway
   - Set backend URL in frontend env vars

2. **Update DNS** (if custom domain)
   - Point domain to Railway URL
   - Update CORS settings

3. **Monitor**
   - Check Sentry for errors
   - Monitor Railway logs
   - Set up alerts

4. **Scale** (if needed)
   - Upgrade Railway plan
   - Add more resources
   - Consider adding Redis/caching

## Cost Warning

Railway charges for:
- Compute time (per hour)
- Memory usage
- Data transfer

Hobby plan ($5/month) includes $5 credit.
Monitor usage in Railway dashboard.

## Getting Help

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issue in your repo
