# Backup Policy

## Overview

This document defines the backup strategy, retention policies, and procedures for the CS490 Job Application Tracker project.

## Backup Strategy

### Backup Types

#### 1. Daily Backups
- **Frequency**: Every day at 2:00 AM UTC
- **Retention**: 7 days
- **Storage**: AWS S3
- **Scope**: Full database dump
- **Auto-delete**: Yes (after 7 days)

#### 2. Weekly Backups
- **Frequency**: Every Sunday at 2:00 AM UTC
- **Retention**: 4 weeks (28 days)
- **Storage**: AWS S3
- **Scope**: Full database dump
- **Auto-delete**: Yes (after 28 days)

#### 3. Monthly Backups
- **Frequency**: First day of each month at 2:00 AM UTC
- **Retention**: 6 months (180 days)
- **Storage**: AWS S3
- **Scope**: Full database dump
- **Auto-delete**: Yes (after 180 days)

#### 4. Manual Backups
- **Frequency**: On-demand
- **Retention**: 30 days
- **Storage**: AWS S3 + GitHub Artifacts
- **Scope**: Full or partial (configurable)
- **Auto-delete**: No (must be manually deleted)

### What Gets Backed Up

#### Database
- ✅ All application tables
- ✅ User data
- ✅ Job applications and offers
- ✅ Resumes metadata
- ✅ Cover letters
- ✅ Skills and certifications
- ✅ Interview data
- ✅ Analytics and metrics
- ❌ Session tokens (excluded)
- ❌ Temporary cache data (excluded)

#### User Files
- ✅ Uploaded resumes (PDFs)
- ✅ Profile pictures
- ✅ Certificate documents
- ✅ Portfolio files
- ❌ Temporary uploads (excluded)

#### Configuration
- ✅ Database schema
- ✅ RLS policies
- ✅ Database functions
- ✅ Triggers and constraints
- ❌ Environment variables (stored in GitHub Secrets)

## Backup Locations

### Primary Storage: AWS S3
- **Bucket**: `cs490-backups` (or your configured bucket)
- **Region**: US East 1 (or your configured region)
- **Path Structure**:
  ```
  database-backups/
    ├── backup-daily-2025-12-16-020000.sql.gz
    ├── backup-weekly-2025-12-15-020000.sql.gz
    └── backup-monthly-2025-12-01-020000.sql.gz
  
  file-backups/
    ├── resumes/
    ├── profile-pictures/
    └── certificates/
  ```
- **Encryption**: AES-256 at rest
- **Access**: Service account only

### Secondary Storage: GitHub Artifacts
- **Retention**: 7 days
- **Purpose**: Emergency access if S3 is unavailable
- **Auto-delete**: Yes (after 7 days)

## Backup Specifications

### Format
- **Database**: PostgreSQL SQL dump (plain text)
- **Compression**: gzip (.gz)
- **Naming**: `backup-{type}-{YYYY-MM-DD-HHmmss}.sql.gz`

### Size Estimates
- **Compressed Database**: ~5-50 MB (varies with data)
- **User Files**: ~100-500 MB (varies with uploads)
- **Total Monthly Storage**: ~1-5 GB

### Integrity Verification
- **Hash**: SHA-256 checksum calculated for each backup
- **Stored**: In backup_history table and S3 metadata
- **Verification**: Automated weekly integrity checks

## Retention Policy Summary

| Backup Type | Frequency | Retention | Storage Location | Auto-Delete |
|-------------|-----------|-----------|------------------|-------------|
| Daily | Daily 2am UTC | 7 days | S3 + GitHub | Yes |
| Weekly | Sunday 2am UTC | 28 days | S3 | Yes |
| Monthly | 1st day 2am UTC | 180 days | S3 | Yes |
| Manual | On-demand | 30 days | S3 + GitHub | No |
| Safety | Before restore | 30 days | S3 | No |

## Restore Procedures

### Who Can Restore
- **Production**: DevOps team + Project Lead (requires approval)
- **Staging**: DevOps team (no approval required)

### Restore Types

#### Full Restore
- Restores entire database
- Drops existing tables
- Recreates schema and data
- Use for: Complete data loss or corruption

#### Tables Only
- Restores schema without data
- Use for: Schema corruption

#### Data Only
- Restores data into existing tables
- Use for: Data corruption with intact schema

### Restore Process
1. **Create safety backup** (automatic)
2. **Download backup** from S3
3. **Verify backup integrity** (checksum)
4. **Restore to database**
5. **Verify restoration** (table counts, key data)
6. **Record event** in restore_history table
7. **Notify team**

### Restore Time Objectives (RTO)
- **Staging**: 15 minutes
- **Production**: 30 minutes
- **Disaster Recovery**: 4-8 hours

### Recovery Point Objectives (RPO)
- **Database**: 24 hours (last daily backup)
- **With PITR**: 1 hour (Supabase Pro only)

## Verification & Testing

### Automated Verification
- **Weekly**: Backup integrity checks
  - File exists in S3
  - File size > minimum threshold
  - Checksum matches
  - Age < 25 hours

### Manual Testing
- **Monthly**: Full restore test to staging
  - Download latest backup
  - Restore to staging database
  - Verify table counts
  - Spot-check data integrity
  - Test application functionality

### Disaster Recovery Drills
- **Quarterly**: Full DR scenario testing
  - Simulate complete data loss
  - Execute full restore procedure
  - Verify RTO/RPO targets
  - Update runbook based on findings

## Monitoring & Alerts

### Success Criteria
- ✅ Backup completes within 10 minutes
- ✅ File size between 1 MB - 500 MB
- ✅ Checksum verifies successfully
- ✅ Uploaded to S3 successfully
- ✅ Recorded in backup_history table

### Failure Alerts
- 🚨 Backup fails
- 🚨 No backup in 25 hours
- 🚨 Backup file too small (< 1 MB)
- 🚨 S3 upload fails
- 🚨 Integrity check fails

### Notification Channels
- Slack: #devops-alerts (immediate)
- Email: devops-team@yourcompany.com
- GitHub Issues: Auto-created on failure

## Security & Access Control

### Backup Access
- **S3 Bucket**: Service account only
- **AWS Credentials**: Stored in GitHub Secrets
- **Encryption**: AES-256 at rest
- **Transmission**: TLS 1.2+ in transit

### Audit Logging
- All backup operations logged in `backup_history` table
- All restore operations logged in `restore_history` table
- S3 access logged via CloudTrail (if enabled)

### Data Privacy
- Backups contain PII (Personal Identifiable Information)
- Must comply with GDPR/privacy regulations
- Backups automatically deleted per retention policy
- Manual deletion available for data subject requests

## Cost Management

### Estimated Monthly Costs

#### Storage (S3)
- Daily backups (7 days × 20 MB): ~$0.30
- Weekly backups (4 weeks × 20 MB): ~$0.20
- Monthly backups (6 months × 20 MB): ~$0.30
- **Total Storage**: ~$0.80/month

#### Data Transfer
- Upload: ~600 MB/month: $0.05
- Download (restores): ~20 MB/month: $0.01
- **Total Transfer**: ~$0.06/month

#### Requests
- PUT/POST: ~30/month: $0.01
- GET: ~10/month: $0.00
- **Total Requests**: ~$0.01/month

**Total Estimated Monthly Cost**: ~$1-3/month

### Cost Optimization
- ✅ Aggressive retention policies (7/28/180 days)
- ✅ Compression (gzip reduces size by 80-90%)
- ✅ Automated cleanup of old backups
- ⏹️ Glacier for long-term archives (optional)
- ⏹️ Cross-region replication (optional, for DR)

## Compliance & Regulations

### FERPA Compliance (Educational Records)
- ✅ Backups stored in secure, encrypted location
- ✅ Access limited to authorized personnel
- ✅ Audit logs maintained
- ✅ Data can be deleted on request

### GDPR Compliance (if applicable)
- ✅ Right to erasure: Manual deletion procedure
- ✅ Data portability: SQL dump format
- ✅ Breach notification: Monitored and alerted
- ✅ Data retention: Automated cleanup

## Backup Exclusions

### Explicitly Excluded Data
- Session tokens and temporary auth data
- Cached data (Redis, if used)
- Temporary file uploads
- Log files (stored separately)
- Environment variables (in GitHub Secrets)
- Third-party API keys (in GitHub Secrets)

## Disaster Recovery Integration

This backup policy supports the following disaster recovery scenarios:

1. **Database Corruption** → Restore from latest backup
2. **Accidental Deletion** → Restore specific tables/data
3. **Bad Deployment** → Code rollback (no backup needed)
4. **Hosting Provider Outage** → Restore to new provider
5. **Complete Data Loss** → Full disaster recovery

See [DISASTER-RECOVERY.md](.github/DISASTER-RECOVERY.md) for detailed runbook.

## Responsibilities

### DevOps Team
- Monitor backup success/failures
- Respond to alerts
- Perform monthly restore tests
- Update backup policies
- Manage S3 storage and costs

### Project Lead
- Approve production restores
- Define retention requirements
- Participate in DR drills
- Review backup reports

### Development Team
- Design database with backup in mind
- Test restore procedures during development
- Report any backup-related issues
- Participate in DR drills

## Review & Updates

### Policy Review Schedule
- **Monthly**: Backup statistics and costs
- **Quarterly**: Policy effectiveness
- **Annually**: Compliance and regulations
- **Ad-hoc**: After incidents or major changes

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial policy | [Your Name] |

---

## Quick Reference

**Backup Schedule**: Daily 2am UTC  
**Retention**: 7 days (daily), 28 days (weekly), 180 days (monthly)  
**Storage**: AWS S3  
**RTO**: 30 minutes  
**RPO**: 24 hours  

**Backup Workflow**: `.github/workflows/backup-database.yml`  
**Restore Workflow**: `.github/workflows/restore-database.yml`  
**Verification Workflow**: `.github/workflows/verify-backups.yml`  

**Contact**: devops@yourcompany.com  
**Emergency**: [Emergency contact number]
