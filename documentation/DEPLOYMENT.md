# Deployment Guide

## Overview

This project uses GitHub Actions for CI/CD with automated deployments to staging and production environments.

## Environments

### Staging
- **Branch**: `develop`
- **Frontend**: https://staging.yourapp.com (Vercel)
- **Backend**: https://api-staging.yourapp.com (Railway)
- **Database**: Supabase Staging Project

### Production
- **Branch**: `main`
- **Frontend**: https://yourapp.com (Vercel)
- **Backend**: https://api.yourapp.com (Railway)
- **Database**: Supabase Production Project

## Workflows

### 1. CI Pipeline (`ci.yml`)
**Triggers**: Every push and pull request
- Runs backend tests (unit + e2e)
- Runs frontend tests
- Linting and type checking
- Security scanning
- Build verification

### 2. Staging Deployment (`deploy-staging.yml`)
**Triggers**: Push to `develop` branch
- Runs CI tests
- Deploys backend to Railway staging
- Runs database migrations
- Deploys frontend to Vercel staging
- Health checks
- Team notifications

### 3. Production Deployment (`deploy-prod.yml`)
**Triggers**: Push to `main` branch
- Creates release tag
- Database backup
- Deploys backend to Railway production
- Runs database migrations
- Deploys frontend to Vercel production
- Comprehensive health checks
- Creates GitHub release
- Team notifications
- Automatic rollback on failure

### 4. Manual Rollback (`rollback.yml`)
**Triggers**: Manual workflow dispatch
- Rolls back to specified version
- Supports staging and production
- Health verification
- Records rollback event

## Setup Instructions

### 1. GitHub Secrets Configuration

Go to **Settings → Secrets and variables → Actions** and add:

#### Supabase (Staging)
- `SUPABASE_URL_STAGING`
- `SUPABASE_ANON_KEY_STAGING`
- `SUPABASE_DATABASE_URL_STAGING`

#### Supabase (Production)
- `SUPABASE_URL_PROD`
- `SUPABASE_ANON_KEY_PROD`
- `SUPABASE_DATABASE_URL_PROD`

#### Railway
- `RAILWAY_TOKEN_STAGING`
- `RAILWAY_TOKEN_PROD`
- `RAILWAY_PROJECT_ID_STAGING`
- `RAILWAY_PROJECT_ID_PROD`

#### Vercel
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Notifications (Optional)
- `SLACK_WEBHOOK_URL`
- `DEPLOYMENT_API_KEY`

### 2. Environment Setup

#### Backend Environment Variables
Create `.env.staging` and `.env.production` with:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<supabase-url>
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<jwt-secret>
OPENAI_API_KEY=<openai-key>
```

#### Frontend Environment Variables
In Vercel project settings, add:
```env
VITE_API_URL=https://api.yourapp.com
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Database Setup

Run the deployment tracking schema:
```sql
-- In Supabase SQL Editor
-- Run: backend/sql/uc132_deployment_tracking.sql
```

### 4. Platform Configuration

#### Railway Setup
1. Create two projects: `yourapp-staging` and `yourapp-production`
2. Install Railway CLI: `npm install -g @railway/cli`
3. Link projects and get tokens
4. Configure environment variables in Railway dashboard

#### Vercel Setup
1. Import repository to Vercel
2. Create staging and production projects
3. Configure build settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### 5. GitHub Environments

Create protected environments in **Settings → Environments**:

#### Staging
- No protection rules (auto-deploy)
- Environment secrets

#### Production
- Required reviewers: 1-2 team members
- Deployment branches: `main` only
- Environment secrets

## Deployment Process

### Regular Deployment Flow

1. **Feature Development**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git commit -m "feat: Add new feature"
   git push origin feature/my-feature
   ```

2. **Pull Request to Develop**
   - CI runs automatically
   - Code review
   - Merge to `develop`
   - **Auto-deploys to Staging**

3. **Testing in Staging**
   - Verify features at https://staging.yourapp.com
   - Run integration tests
   - Get stakeholder approval

4. **Deploy to Production**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
   - **Auto-deploys to Production**
   - Creates release tag
   - Sends notifications

### Hotfix Process

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/critical-bug main
   # Fix the bug
   git commit -m "fix: Critical bug"
   ```

2. **Deploy Hotfix**
   ```bash
   # Merge to main for production
   git checkout main
   git merge hotfix/critical-bug
   git push origin main
   
   # Merge back to develop
   git checkout develop
   git merge hotfix/critical-bug
   git push origin develop
   ```

### Rollback Process

If a deployment causes issues:

1. **Manual Rollback via GitHub UI**
   - Go to **Actions → Rollback Deployment**
   - Click "Run workflow"
   - Select environment (staging/production)
   - Enter version tag (e.g., `v2025.12.15-28`)
   - Enter reason
   - Click "Run workflow"

2. **Automatic Rollback**
   - Production deployments automatically rollback on health check failure
   - Team is notified immediately

## Monitoring Deployments

### View Deployment History

```sql
-- In Supabase SQL Editor
SELECT 
  environment,
  version,
  "deployedBy",
  status,
  "durationSeconds",
  "createdAt"
FROM deployment_history
ORDER BY "createdAt" DESC
LIMIT 20;
```

### View Deployment Metrics

```sql
SELECT 
  environment,
  "totalDeployments",
  "successfulDeployments",
  "failedDeployments",
  "avgDeploymentTimeSeconds",
  "deploymentFrequency"
FROM deployment_metrics
ORDER BY "periodStart" DESC;
```

### GitHub Actions Logs
- Go to **Actions** tab
- Click on workflow run
- View detailed logs for each step

## Health Check Endpoints

Ensure these endpoints exist in your backend:

```typescript
// backend/src/app.controller.ts
@Get('/health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
}

@Get('/api/status')
apiStatus() {
  return {
    status: 'operational',
    version: process.env.npm_package_version,
    database: 'connected',
  };
}
```

## Troubleshooting

### Deployment Fails

1. **Check CI Logs**
   - View workflow run in Actions tab
   - Look for test failures or build errors

2. **Health Check Fails**
   - Verify environment variables are set correctly
   - Check Railway/Vercel logs for runtime errors

3. **Database Migration Issues**
   - Verify DATABASE_URL is correct
   - Check migration files for syntax errors
   - Review Supabase logs

### Rollback Issues

1. **Version Not Found**
   - Check GitHub releases for valid version tags
   - Use exact tag format: `v2025.12.16-42`

2. **Health Check Still Fails**
   - May need to rollback database migrations manually
   - Check if issue is in infrastructure (Railway/Vercel)

## Best Practices

### Before Deploying
- ✅ All tests pass locally
- ✅ Code reviewed and approved
- ✅ Tested in staging environment
- ✅ Database migrations are backwards compatible
- ✅ Environment variables updated (if needed)

### After Deploying
- ✅ Verify health checks pass
- ✅ Test critical user flows
- ✅ Monitor error tracking (Sentry, etc.)
- ✅ Check deployment metrics

### Deployment Frequency
- **Staging**: Multiple times per day (any time)
- **Production**: 1-2 times per day (business hours preferred)
- **Hotfixes**: As needed (any time)

## Metrics and KPIs

Track these deployment metrics:

- **Deployment Frequency**: How often you deploy
- **Lead Time**: Time from commit to production
- **MTTR**: Mean Time To Recovery (from failures)
- **Change Failure Rate**: % of deployments causing issues
- **Deployment Duration**: Average time per deployment

Query metrics dashboard:
```sql
SELECT 
  environment,
  AVG("durationSeconds") as avg_duration,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE "deploymentType" = 'rollback') as rollback_count
FROM deployment_history
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY environment;
```

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review platform logs (Railway, Vercel)
3. Contact DevOps team
4. Create incident in project management tool
