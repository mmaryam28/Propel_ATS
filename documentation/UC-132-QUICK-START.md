# UC-132: CI/CD Pipeline - Quick Start Guide

## 🚀 What This Does

Automatically tests and deploys your code when you push to GitHub:
- **Push to `develop`** → Auto-deploys to Staging
- **Push to `main`** → Auto-deploys to Production
- Tests run on every push/PR
- One-click rollback if something goes wrong

## ⚡ Quick Setup (5 Steps)

### 1. Add GitHub Secrets

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add these (get values from Supabase dashboard):

```
SUPABASE_URL_STAGING=your-staging-supabase-url
SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_URL_PROD=your-production-supabase-url
SUPABASE_ANON_KEY_PROD=your-production-anon-key
```

### 2. Set Up Vercel

1. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
2. Root Directory: `frontend`
3. Add environment variables:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Get Vercel tokens:
- Go to Vercel Settings → Tokens → Create
- Add to GitHub secrets as `VERCEL_TOKEN`

### 3. Set Up Railway (Backend Hosting)

1. Go to [railway.app](https://railway.app) → New Project
2. Connect GitHub repo
3. Set root directory to `backend`
4. Add environment variables (copy from your `.env`)

Get Railway token:
- Railway Settings → Tokens → Create
- Add to GitHub secrets as `RAILWAY_TOKEN_PROD`

### 4. Create Database Table

Run this in Supabase SQL Editor:
```sql
-- Copy contents from: backend/sql/uc132_deployment_tracking.sql
```

### 5. Push Code

```bash
git add .
git commit -m "feat: Set up CI/CD pipeline"
git push origin develop
```

Watch it deploy in **GitHub Actions** tab! 🎉

## 🔄 How to Use

### Deploy to Staging
```bash
git push origin develop
```
Automatically deploys to staging environment.

### Deploy to Production
```bash
git checkout main
git merge develop
git push origin main
```
Automatically deploys to production (with approval if configured).

### Rollback a Deployment
1. Go to GitHub → **Actions**
2. Select **Rollback Deployment** workflow
3. Click **Run workflow**
4. Choose environment and version
5. Click **Run workflow**

## 📊 View Deployment History

In Supabase SQL Editor:
```sql
SELECT 
  environment,
  version,
  "deployedBy",
  status,
  "createdAt"
FROM deployment_history
ORDER BY "createdAt" DESC
LIMIT 10;
```

## 🔍 Check Deployment Status

- **GitHub Actions Tab**: See live deployment progress
- **Vercel Dashboard**: Frontend deployment status
- **Railway Dashboard**: Backend deployment status

## ⚠️ Common Issues

### "Tests Failed"
- Check Actions tab for error details
- Fix tests locally: `npm test`
- Push fix

### "Deployment Failed"
- Check if environment variables are set correctly
- Verify Railway/Vercel projects are connected
- Check platform logs for errors

### "Health Check Failed"
- Backend might not be responding
- Check Railway logs
- Verify API URL is correct

## 🎯 Next Steps

1. **Add Team Notifications** (Optional)
   - Create Slack webhook
   - Add `SLACK_WEBHOOK_URL` to GitHub secrets
   - Uncomment Slack notification sections in workflow files

2. **Configure Protected Branches**
   - Settings → Branches → Add rule for `main`
   - Require PR approvals before merging
   - Require status checks to pass

3. **Set Up Monitoring** (Recommended)
   - Add error tracking (Sentry, Rollbar)
   - Set up uptime monitoring
   - Configure alerts for failed deployments

## 📚 Full Documentation

See [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md) for complete documentation.

## 🆘 Need Help?

1. Check GitHub Actions logs
2. Review platform logs (Railway/Vercel)
3. Ask in team chat
4. Check [DEPLOYMENT.md](.github/DEPLOYMENT.md) troubleshooting section
