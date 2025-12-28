# 🚨 Disaster Recovery Runbook

## Emergency Contacts

**Incident Commander**: [Your Name]  
**Phone**: [Phone Number]  
**Email**: [Email Address]

**DevOps Team**: [Team Contact]  
**Database Admin**: [DBA Contact]  
**Management**: [Manager Contact]

**External Services**:
- Supabase Support: support@supabase.io
- Railway Support: https://railway.app/help
- Vercel Support: https://vercel.com/support

## Access & Credentials

**GitHub**: https://github.com/[your-org]/[your-repo]
- Actions: Backup & Restore workflows
- Secrets: Environment variables

**Supabase Dashboard**: https://app.supabase.com
- Production: [Project URL]
- Staging: [Project URL]

**Railway Dashboard**: https://railway.app
- Production: [Project URL]
- Staging: [Project URL]

**Vercel Dashboard**: https://vercel.com
- Production: [Project URL]
- Staging: [Project URL]

**S3 Backup Storage**: 
- Bucket: [Bucket Name]
- Region: [AWS Region]
- Console: https://console.aws.amazon.com/s3

---

## Disaster Scenarios & Response

### Scenario 1: Database Corruption

**Severity**: 🔴 Critical  
**RTO**: 30 minutes  
**RPO**: 24 hours (last daily backup)

#### Symptoms:
- Unable to query database
- Data returning NULL or incorrect values
- Foreign key constraint violations
- Transaction errors

#### Response Steps:

1. **Assess Damage** (2 minutes)
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Check table counts
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM jobs;
   SELECT COUNT(*) FROM job_applications;
   
   # Check for corruption
   SELECT * FROM pg_stat_database;
   ```

2. **Stop Application** (3 minutes)
   - Pause Railway backend service
   - Display maintenance page on frontend
   - Notify users via status page

3. **Create Safety Backup** (5 minutes)
   ```bash
   # Even if corrupted, backup current state
   pg_dump $DATABASE_URL > corrupted-backup-$(date +%Y%m%d-%H%M%S).sql
   ```

4. **Identify Latest Good Backup** (2 minutes)
   - Go to GitHub Actions → Backup Database workflow
   - Check run history for last successful backup
   - Note filename: `backup-daily-YYYY-MM-DD-HHMMSS.sql.gz`

5. **Restore from Backup** (15 minutes)
   - Go to GitHub Actions → Restore Database from Backup
   - Click "Run workflow"
   - Select:
     - Environment: `production`
     - Backup filename: `[filename from step 4]`
     - Restore type: `full`
     - Confirmation: Type `RESTORE`
   - Click "Run workflow"
   - Monitor logs in real-time

6. **Verify Restore** (3 minutes)
   ```bash
   # Check critical tables
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM jobs;"
   
   # Test application login
   # Test critical API endpoints
   ```

7. **Resume Service** (2 minutes)
   - Resume Railway backend
   - Remove maintenance page
   - Monitor error logs

8. **Post-Incident**
   - Document data loss (if any)
   - Notify affected users
   - Schedule post-mortem meeting
   - Update disaster recovery plan

---

### Scenario 2: Accidental Data Deletion

**Severity**: 🟠 High  
**RTO**: 15 minutes  
**RPO**: 1 hour (if using PITR) or 24 hours (daily backup)

#### Symptoms:
- User reports missing data
- Query returns fewer rows than expected
- Audit logs show DELETE queries

#### Response Steps:

1. **Identify Deletion** (2 minutes)
   ```sql
   -- Check when data was deleted
   SELECT * FROM audit_logs WHERE action = 'DELETE' ORDER BY created_at DESC LIMIT 20;
   
   -- Identify affected tables
   SELECT table_name FROM affected_tables;
   ```

2. **Stop Further Damage** (1 minute)
   - Revoke user permissions temporarily
   - Disable affected API endpoints if needed

3. **Option A: Point-in-Time Recovery** (if Supabase Pro)
   - Go to Supabase Dashboard → Database → Restore
   - Select timestamp BEFORE deletion
   - Click "Restore to this point"
   - Wait 10-15 minutes

4. **Option B: Selective Restore from Backup** (15 minutes)
   ```bash
   # Download latest backup
   aws s3 cp s3://[bucket]/database-backups/backup-daily-latest.sql.gz .
   gunzip backup-daily-latest.sql.gz
   
   # Extract only affected table
   pg_restore --table=affected_table backup-daily-latest.sql | psql $DATABASE_URL
   ```

5. **Verify Restoration** (2 minutes)
   - Count rows in affected table
   - Spot-check with user who reported issue
   - Verify data integrity

6. **Resume Normal Operations** (1 minute)
   - Re-enable permissions
   - Re-enable API endpoints
   - Notify users

---

### Scenario 3: Bad Deployment

**Severity**: 🟡 Medium  
**RTO**: 5 minutes  
**RPO**: 0 (code rollback, no data loss)

#### Symptoms:
- 500 errors after deployment
- Features not working
- Performance degradation

#### Response Steps:

1. **Identify Issue** (1 minute)
   - Check Railway/Vercel logs
   - Check GitHub Actions deployment logs
   - Check user reports

2. **Rollback Deployment** (3 minutes)
   - Go to GitHub Actions → Rollback Deployment
   - Click "Run workflow"
   - Select:
     - Environment: `production`
     - Version: `[previous working version]`
     - Reason: "Bad deployment - [issue description]"
   - Click "Run workflow"

3. **Verify Rollback** (1 minute)
   - Check health endpoints
   - Test affected features
   - Monitor error rates

4. **Post-Incident**
   - Fix code issue
   - Test in staging
   - Re-deploy when ready

---

### Scenario 4: Hosting Provider Outage

**Severity**: 🔴 Critical  
**RTO**: 4 hours  
**RPO**: 24 hours

#### Symptoms:
- Railway/Vercel status page shows outage
- All services unreachable
- DNS not resolving

#### Response Steps:

1. **Confirm Outage** (5 minutes)
   - Check Railway status: https://status.railway.app
   - Check Vercel status: https://www.vercel-status.com
   - Check Supabase status: https://status.supabase.com
   - Check if it's regional or global

2. **Activate Backup Hosting** (2 hours)
   
   **Backend:**
   ```bash
   # Deploy to backup hosting (e.g., Render, Fly.io)
   git clone [repo]
   cd backend
   # Configure backup hosting platform
   # Deploy application
   ```
   
   **Frontend:**
   ```bash
   # Deploy to Netlify or Cloudflare Pages
   cd frontend
   npm run build
   # Deploy to backup platform
   ```

3. **Update DNS** (30 minutes)
   - Point A records to backup hosting IPs
   - Update CNAME records
   - Wait for DNS propagation (5-30 minutes)

4. **Database Migration** (1 hour)
   - Restore latest backup to new database instance
   - Update DATABASE_URL in backend
   - Run migrations if needed

5. **Verify All Services** (30 minutes)
   - Test login
   - Test critical user flows
   - Monitor error rates
   - Check performance

6. **Communication**
   - Post status update
   - Email users about temporary service changes
   - Update social media

7. **When Primary Service Returns**
   - Test primary hosting
   - Sync any data changes
   - Gradually migrate back
   - Monitor stability

---

### Scenario 5: Complete Data Center Failure

**Severity**: 🔴 Critical  
**RTO**: 8 hours  
**RPO**: 24 hours

#### Response Steps:

1. **Declare Disaster** (5 minutes)
   - Activate incident response team
   - Notify all stakeholders
   - Begin time tracking for RTO/RPO

2. **Access Backup Storage** (10 minutes)
   - Verify S3 backup bucket accessible
   - Download latest backups
   - Verify backup integrity

3. **Provision New Infrastructure** (2 hours)
   - Create new Supabase project (different region)
   - Create new Railway/Render project
   - Create new Vercel project
   - Update DNS records

4. **Restore Database** (1 hour)
   ```bash
   # Download latest backup
   aws s3 cp s3://[bucket]/database-backups/backup-daily-latest.sql.gz .
   gunzip backup-daily-latest.sql.gz
   
   # Restore to new database
   psql $NEW_DATABASE_URL < backup-daily-latest.sql
   ```

5. **Deploy Applications** (2 hours)
   ```bash
   # Backend
   cd backend
   # Update environment variables
   # Deploy to new Railway project
   
   # Frontend
   cd frontend
   # Update environment variables
   # Deploy to new Vercel project
   ```

6. **Restore User Files** (1 hour)
   ```bash
   # Sync uploaded files from backup bucket
   aws s3 sync s3://[backup-bucket]/uploads s3://[new-bucket]/uploads
   ```

7. **Update DNS** (30 minutes)
   - Point all DNS records to new infrastructure
   - Update NS records if needed
   - Wait for propagation

8. **Comprehensive Testing** (1 hour)
   - Test all critical user flows
   - Verify data integrity
   - Check all integrations
   - Load test if possible

9. **Go Live**
   - Remove maintenance page
   - Announce service restoration
   - Monitor closely for 24 hours

10. **Post-Incident Review** (1 week later)
    - Document timeline
    - Calculate actual RTO/RPO
    - Identify improvements
    - Update runbook

---

## Quick Reference Commands

### Check Database Health
```bash
# Connect to database
psql $DATABASE_URL

# Check connection
\conninfo

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check for long-running queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '5 minutes';
```

### List Available Backups
```bash
# Using AWS CLI
aws s3 ls s3://[bucket]/database-backups/ --human-readable

# Using Node.js script
cd backend
node scripts/list-backups.js
```

### Download Backup
```bash
# Latest daily backup
aws s3 cp s3://[bucket]/database-backups/backup-daily-latest.sql.gz .

# Specific backup
aws s3 cp s3://[bucket]/database-backups/backup-daily-2025-12-16-020000.sql.gz .
```

### Manual Backup
```bash
# Quick backup
pg_dump $DATABASE_URL | gzip > manual-backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Manual Restore
```bash
# Decompress and restore
gunzip backup-daily-2025-12-16-020000.sql.gz
psql $DATABASE_URL < backup-daily-2025-12-16-020000.sql
```

### Check Service Status
```bash
# Backend health
curl https://api.yourapp.com/health

# Frontend health
curl https://yourapp.com

# Database connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## Communication Templates

### Internal Alert (Slack/Email)
```
🚨 INCIDENT ALERT - [Severity Level]

Issue: [Brief description]
Impact: [User-facing impact]
Status: Investigating / Mitigating / Resolved
ETA: [Expected resolution time]
Incident Commander: [Name]

Updates will be provided every 15 minutes.
```

### User-Facing Status Update
```
We're currently experiencing [issue description]. Our team is actively working on a resolution.

Current Status: [Investigating / Working on Fix / Monitoring]
Affected Services: [List services]
Estimated Resolution: [Time estimate]

We'll provide updates every 30 minutes. Thank you for your patience.

Last updated: [Timestamp]
```

### Post-Incident Summary
```
INCIDENT SUMMARY - [Date]

Duration: [Start time] - [End time] ([Total duration])
Root Cause: [Brief explanation]
Impact: [User/data impact]
Resolution: [What we did]

RTO: [Target] / [Actual]
RPO: [Target] / [Actual]

Next Steps:
- [Action item 1]
- [Action item 2]

We apologize for the disruption. Full post-mortem available at: [URL]
```

---

## Post-Incident Checklist

After resolving any disaster:

- [ ] Document timeline of events
- [ ] Calculate actual RTO and RPO
- [ ] Assess data loss (if any)
- [ ] Identify root cause
- [ ] List all actions taken
- [ ] Note what worked well
- [ ] Note what could be improved
- [ ] Schedule post-mortem meeting (within 72 hours)
- [ ] Update runbook with lessons learned
- [ ] Implement preventive measures
- [ ] Test improvements
- [ ] Communicate with users
- [ ] Update documentation
- [ ] Review and update backup strategy
- [ ] Train team on new procedures

---

## Regular Maintenance

### Daily
- [ ] Check backup completion (automated)
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly
- [ ] Verify backup integrity (automated)
- [ ] Review backup statistics
- [ ] Test restore to staging

### Monthly
- [ ] Full restore test to staging
- [ ] Review retention policies
- [ ] Update runbook
- [ ] Review access controls

### Quarterly
- [ ] Disaster recovery drill
- [ ] Update contact information
- [ ] Review and update RTO/RPO targets
- [ ] Test failover procedures
- [ ] Update documentation

---

## Useful Links

- **Backup Workflows**: https://github.com/[your-repo]/actions
- **Monitoring Dashboard**: [Your monitoring URL]
- **Status Page**: [Your status page]
- **Documentation**: [Your docs URL]
- **Incident Management**: [Your incident tool]
- **Communication Channel**: [Your team chat]

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial runbook | [Your Name] |

---

**Remember**: Stay calm, follow the runbook, communicate clearly, and document everything.
