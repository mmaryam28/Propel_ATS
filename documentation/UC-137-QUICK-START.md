# UC-137: Backup and Disaster Recovery - Quick Start

## 🚀 Setup (5 Minutes)

### 1. Add GitHub Secrets

Go to repo **Settings → Secrets and variables → Actions**:

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
BACKUP_S3_BUCKET=your-backup-bucket-name
SUPABASE_DATABASE_URL_PROD=postgresql://...
SUPABASE_DATABASE_URL_STAGING=postgresql://...
```

### 2. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://your-backup-bucket-name --region us-east-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket your-backup-bucket-name \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set lifecycle policy (auto-delete old backups)
aws s3api put-bucket-lifecycle-configuration \
  --bucket your-backup-bucket-name \
  --lifecycle-configuration file://backup-lifecycle.json
```

Create `backup-lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldDailyBackups",
      "Filter": { "Prefix": "database-backups/backup-daily-" },
      "Status": "Enabled",
      "Expiration": { "Days": 7 }
    },
    {
      "Id": "DeleteOldWeeklyBackups",
      "Filter": { "Prefix": "database-backups/backup-weekly-" },
      "Status": "Enabled",
      "Expiration": { "Days": 28 }
    },
    {
      "Id": "DeleteOldMonthlyBackups",
      "Filter": { "Prefix": "database-backups/backup-monthly-" },
      "Status": "Enabled",
      "Expiration": { "Days": 180 }
    }
  ]
}
```

### 3. Run Database Migration

Execute in Supabase SQL Editor:
```sql
-- Run: backend/sql/uc137_backup_disaster_recovery.sql
```

### 4. Test Backup Workflow

```bash
# Trigger manual backup
# Go to: GitHub → Actions → Automated Database Backup → Run workflow
# Select: backup_type = "manual"
```

---

## 📋 How to Use

### Create Manual Backup
1. GitHub → **Actions** → **Automated Database Backup**
2. Click **Run workflow**
3. Select backup type: `manual`
4. Click **Run workflow**
5. Wait 2-5 minutes
6. Check run logs for success

### Restore from Backup
1. GitHub → **Actions** → **Restore Database from Backup**
2. Click **Run workflow**
3. Fill in:
   - Environment: `staging` or `production`
   - Backup filename: `backup-daily-2025-12-16-020000.sql.gz`
   - Restore type: `full`
   - Confirmation: Type `RESTORE` (case-sensitive)
4. Click **Run workflow**
5. Monitor logs (15-30 minutes)

### Verify Backups
1. GitHub → **Actions** → **Verify Backups**
2. Click **Run workflow** (or wait for weekly schedule)
3. Check logs for:
   - ✅ Backup age < 25 hours
   - ✅ File size > 1 MB
   - ✅ Integrity checks passed

---

## 🗓️ Backup Schedule

| Type | Schedule | Retention | Auto-Delete |
|------|----------|-----------|-------------|
| Daily | 2:00 AM UTC daily | 7 days | Yes |
| Weekly | 2:00 AM UTC Sunday | 28 days | Yes |
| Monthly | 2:00 AM UTC 1st day | 180 days | Yes |
| Manual | On-demand | 30 days | No |

---

## 🔍 View Backup History

### In Supabase SQL Editor:

```sql
-- Recent backups
SELECT 
  "backupType",
  filename,
  status,
  ROUND("fileSizeBytes" / 1024.0 / 1024.0, 2) as size_mb,
  "createdAt"
FROM backup_history
ORDER BY "createdAt" DESC
LIMIT 10;

-- Backup statistics
SELECT * FROM backup_statistics;

-- Restore history
SELECT 
  environment,
  "backupFilename",
  "restoreType",
  status,
  "restoredBy",
  "createdAt"
FROM restore_history
ORDER BY "createdAt" DESC
LIMIT 10;
```

### List Backups in S3:

```bash
aws s3 ls s3://your-backup-bucket-name/database-backups/ --human-readable

# Download specific backup
aws s3 cp s3://your-backup-bucket-name/database-backups/backup-daily-2025-12-16-020000.sql.gz .
```

---

## 🚨 Disaster Recovery Scenarios

### Scenario 1: Database Corrupted
**RTO**: 30 minutes | **RPO**: 24 hours

1. Go to Actions → Restore Database from Backup
2. Select `production` environment
3. Choose latest `backup-daily-*.sql.gz`
4. Restore type: `full`
5. Type `RESTORE` and run

### Scenario 2: Accidentally Deleted Data
**RTO**: 15 minutes | **RPO**: 24 hours

1. Identify when deletion occurred
2. Find backup taken BEFORE deletion
3. Use restore workflow with that backup
4. Restore type: `data_only` (keeps schema)

### Scenario 3: Bad Deployment
**RTO**: 5 minutes | **RPO**: 0

1. Use rollback workflow from UC-132
2. No database restore needed (code issue)

See [DISASTER-RECOVERY.md](.github/DISASTER-RECOVERY.md) for complete runbook.

---

## ✅ Testing Checklist

Weekly verification (automated):
- [ ] Backup completed in last 25 hours
- [ ] Backup file size > 1 MB
- [ ] Backup integrity verified
- [ ] Backup recorded in database

Monthly testing (manual):
- [ ] Download latest backup
- [ ] Restore to staging environment
- [ ] Verify table counts
- [ ] Test application functionality

Quarterly drill (manual):
- [ ] Simulate disaster scenario
- [ ] Execute full restore procedure
- [ ] Measure actual RTO/RPO
- [ ] Update procedures based on findings

---

## 💰 Cost Estimate

**Monthly AWS S3 Costs:**
- Storage (5 GB): ~$0.12
- Requests: ~$0.01
- Data transfer: ~$0.05
- **Total**: ~$0.20-$0.50/month

**Free Tier Benefits:**
- 5 GB storage free for 12 months
- 20,000 GET requests/month free
- 2,000 PUT requests/month free

---

## 📊 Monitoring

### Success Indicators
✅ Daily backup completed at 2 AM UTC  
✅ Backup file uploaded to S3  
✅ Backup recorded in database  
✅ Integrity check passes weekly  
✅ No backup failures in last 7 days  

### Failure Alerts
❌ Backup fails → Check GitHub Actions logs  
❌ No backup in 25 hours → Run manual backup  
❌ File too small → Check database connectivity  
❌ S3 upload fails → Check AWS credentials  
❌ Integrity fails → Investigate backup process  

### Where to Check
- **GitHub Actions**: Workflow run history
- **Supabase**: Query backup_history table
- **S3 Console**: List objects in bucket
- **Slack** (if configured): Automated alerts

---

## 🔧 Troubleshooting

### Backup Fails

**Error**: "pg_dump: connection to database failed"
- Check SUPABASE_DATABASE_URL secret is correct
- Verify database is accessible
- Check Supabase project status

**Error**: "S3 upload failed"
- Verify AWS credentials in GitHub secrets
- Check S3 bucket exists and is accessible
- Verify bucket name and region

**Error**: "Backup file too small"
- Database might be empty (check table counts)
- Backup might have failed silently
- Check pg_dump command succeeded

### Restore Fails

**Error**: "Backup file not found in S3"
- Check filename is exact (case-sensitive)
- Verify backup exists: `aws s3 ls s3://bucket/database-backups/`
- Use correct path prefix

**Error**: "Restore verification failed"
- Database might be corrupted
- Backup file might be incomplete
- Try different backup file

**Error**: "Safety backup creation failed"
- Not enough disk space
- Database connection issues
- Skip safety backup (not recommended)

---

## 📚 Documentation

- **Backup Policy**: [BACKUP-POLICY.md](BACKUP-POLICY.md)
- **Disaster Recovery Runbook**: [.github/DISASTER-RECOVERY.md](.github/DISASTER-RECOVERY.md)
- **Database Schema**: [backend/sql/uc137_backup_disaster_recovery.sql](backend/sql/uc137_backup_disaster_recovery.sql)

---

## 🆘 Emergency Contacts

**Incident Commander**: [Your Name]  
**DevOps Team**: [Team Email/Slack]  
**Emergency**: [Phone Number]  

**External Support**:
- Supabase: support@supabase.io
- AWS Support: Console → Support Center
- GitHub: https://support.github.com

---

## ✨ Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Create S3 bucket
3. ✅ Run database migration
4. ✅ Test backup workflow
5. ✅ Test restore to staging
6. ✅ Schedule monthly restore tests
7. ✅ Review disaster recovery runbook
8. ✅ Add team to notification channels
9. ✅ Update contact information
10. ✅ Schedule quarterly DR drill

---

**Status**: Ready to use after setup complete  
**Last Updated**: December 16, 2025  
**Version**: 1.0
