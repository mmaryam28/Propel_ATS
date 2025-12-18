# Railway Deployment Guide

This guide explains how to deploy the Propel backend to Railway.

## Prerequisites
- GitHub account with this repository pushed
- Railway account (sign up at https://railway.app)
- All environment variables ready (see `.env.example`)

## What Was Prepared for You

### Files Created/Modified:
1. **backend/Dockerfile** - Multi-stage Docker build with Ollama integration
2. **backend/start.sh** - Startup script that launches Ollama and NestJS
3. **backend/.dockerignore** - Excludes unnecessary files from Docker image
4. **backend/.env.example** - Template for environment variables (includes Ollama config)
5. **railway.json** - Railway configuration
6. **backend/src/main.ts** - Updated to use `process.env.PORT`
7. **backend/src/app.controller.ts** - Added health check endpoints

### How Ollama is Integrated:
- Ollama runs in the same container as your NestJS backend
- On startup, the `start.sh` script:
  1. Starts Ollama service in background
  2. Waits for Ollama to be ready
  3. Pulls the phi3 model (configurable via OLLAMA_MODEL env var)
  4. Starts your NestJS application
- Your cover letter AI service connects to `http://localhost:11434`

## Local Testing (Optional but Recommended)

Test the Docker build locally before deploying:

```bash
# Navigate to project root
cd C:\Users\ld403\Downloads\CS490\CS490-Project

# Build the Docker image
docker build -t propel-backend -f backend/Dockerfile backend/

# Run the container
docker run -p 3000:3000 --env-file backend/.env propel-backend

# Test the health check
# Open browser: http://localhost:3000/health
```

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Navigate to project root
cd C:\Users\ld403\Downloads\CS490\CS490-Project

# Add all new files
git add .

# Commit changes
git commit -m "Add Railway deployment configuration"

# Push to GitHub
git push origin main
```

### Step 2: Railway UI Setup

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub
   - Authorize Railway to access your repositories

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `Khalid-Itani/CS490-Project`
   - Railway will detect the Dockerfile automatically

3. **Configure Root Directory**
   - Go to project Settings
   - Set "Root Directory" to `backend`
   - This tells Railway where your Dockerfile is located

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add each variable from your `.env` file:

   ```
   FRONTEND_URL=https://your-frontend.railway.app (or your actual frontend URL)
   APP_NAME=Propel
   EMAIL_FROM=Propel <propel.resumeai@gmail.com>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=propel.resumeai@gmail.com
   SMTP_PASS=your-smtp-password
   SUPABASE_URL=https://isnkdobfeftngvxwtrve.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   LINKEDIN_REDIRECT_URI=https://your-backend.railway.app/linkedin-auth/callback
   LINKEDIN_CALLBACK_URL=https://your-backend.railway.app/auth/linkedin/callback
   OPENAI_API_KEY=your-openai-key
   OLLAMA_URL=http://localhost:11434/api/generate
   OLLAMA_MODEL=phi3
   SENTRY_AUTH_TOKEN=your-sentry-token
   NODE_ENV=production
   ```

   **Important:** 
   - Replace placeholder values with your actual credentials!
   - `OLLAMA_MODEL` can be changed to other models (e.g., `llama2`, `mistral`)
   - Ollama will automatically download the model on first startup

5. **Generate Domain**
   - Go to "Settings" tab
   - Under "Networking" → "Public Networking"
   - Click "Generate Domain"
   - Copy the generated URL (e.g., `propel-backend.up.railway.app`)

6. **Update Callback URLs**
   - Go back to Variables
   - Update these with your Railway domain:
     ```
     LINKEDIN_REDIRECT_URI=https://your-railway-domain.railway.app/linkedin-auth/callback
     LINKEDIN_CALLBACK_URL=https://your-railway-domain.railway.app/auth/linkedin/callback
     ```

7. **Deploy**
   - Railway automatically deploys on push
   - Check "Deployments" tab for build logs
   - Wait for "Success" status

### Step 3: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-railway-domain.railway.app/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "uptime": 123.45,
     "timestamp": "2025-12-17T...",
     "environment": "production",
     "services": {
       "database": "connected",
       "api": "operational"
     }
   }
   ```

2. **Check Basic Endpoint**
   ```bash
   curl https://your-railway-domain.railway.app/
   ```

3. **Check Logs**
   - In Railway dashboard, click on your service
   - Go to "Logs" tab
   - Look for: `🚀 Application is running on port XXXX`

4. **Test Database Connection**
   - Try accessing an authenticated endpoint
   - Check Supabase connection is working

## Troubleshooting

### Build Fails
- Check "Deployments" → "Build Logs" in Railway
- Common issues:
  - Missing dependencies in package.json
  - TypeScript compilation errors
  - Docker build errors

### App Crashes on Start
- Check "Logs" tab in Railway
- Common issues:
  - Missing environment variables
  - Database connection failure
  - Port binding issues (ensure using `process.env.PORT`)

### CORS Errors
- Ensure `FRONTEND_URL` environment variable is set correctly
- Check browser console for specific CORS error
- Verify frontend URL is in allowed origins list

### 502 Bad Gateway
- App is crashing or not starting
- Check logs for error messages
- Verify all required env vars are set
- Check health endpoint directly

## Updating Your Deployment

Whenever you push to GitHub, Railway automatically:
1. Pulls latest code
2. Rebuilds Docker image
3. Redeploys with zero downtime

```bash
# Make changes to code
git add .
git commit -m "Your commit message"
git push origin main

# Railway automatically deploys!
```

## Cost Estimates

⚠️ **Important Note about Ollama:**
Running Ollama with AI models requires significant resources:
- **Minimum:** 2GB RAM (for phi3 model)
- **Recommended:** 4GB+ RAM for better performance
- Railway's Hobby plan may struggle with Ollama
- Consider **Pro plan ($20/month)** or use smaller models

Railway pricing (as of 2025):
- **Hobby Plan:** $5/month
  - $5 credit included
  - Limited resources (may not be sufficient for Ollama)
  - Best for testing without AI features

- **Pro Plan:** $20/month (Recommended for Ollama)
  - More resources and priority support
  - Better for running AI models
  - More reliable performance

**Alternative:** Keep Ollama running locally and use OpenAI API in production to reduce costs.

## Frontend Deployment

You'll need to deploy the frontend separately:
- Option 1: Railway (follow similar process)
- Option 2: Vercel (easier for React/Vite apps)
- Option 3: Netlify

Update `FRONTEND_URL` environment variable with the deployed frontend URL.

## Security Checklist

- [ ] All sensitive data in environment variables (not in code)
- [ ] `.env` file is in `.gitignore` (already done)
- [ ] HTTPS enabled (Railway does this automatically)
- [ ] CORS configured correctly with your frontend URL
- [ ] JWT secret is strong and random
- [ ] Database credentials are secure
- [ ] Sentry configured for error monitoring

## Support

If you encounter issues:
1. Check Railway logs
2. Check GitHub Actions (if enabled)
3. Review this guide
4. Contact Railway support: https://railway.app/help
