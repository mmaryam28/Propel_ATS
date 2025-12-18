-- UC-137: Backup and Disaster Recovery
-- Tables for tracking backups, restores, and disaster recovery events

-- Backup history table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "backupType" VARCHAR(50) NOT NULL CHECK ("backupType" IN ('daily', 'weekly', 'monthly', 'manual')),
  filename VARCHAR(255) NOT NULL UNIQUE,
  "fileSizeBytes" BIGINT,
  "fileHash" VARCHAR(64), -- SHA256 hash
  "storageLocation" VARCHAR(100) DEFAULT 's3', -- 's3', 'local', 'glacier'
  
  -- Backup status
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'deleted')),
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "durationSeconds" INTEGER,
  
  -- Backup details
  "tableCount" INTEGER,
  "rowCount" BIGINT,
  "compressionRatio" DECIMAL(5,2),
  
  -- Metadata
  "createdBy" VARCHAR(255) NOT NULL,
  "errorMessage" TEXT,
  "backupMetadata" JSONB, -- Additional metadata (database version, etc.)
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Restore history table
CREATE TABLE IF NOT EXISTS restore_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(50) NOT NULL CHECK (environment IN ('staging', 'production')),
  "backupFilename" VARCHAR(255) NOT NULL,
  "restoreType" VARCHAR(50) CHECK ("restoreType" IN ('full', 'tables_only', 'data_only', 'partial')),
  
  -- Restore status
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "durationSeconds" INTEGER,
  
  -- Safety information
  "safetyBackupFilename" VARCHAR(255), -- Backup taken before restore
  "restoredBy" VARCHAR(255) NOT NULL,
  "approvedBy" VARCHAR(255),
  "restoreReason" TEXT,
  
  -- Verification
  "verificationPassed" BOOLEAN,
  "verificationDetails" JSONB,
  
  -- Metadata
  "errorMessage" TEXT,
  "restoreMetadata" JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Disaster recovery events table
CREATE TABLE IF NOT EXISTS disaster_recovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "incidentType" VARCHAR(100) NOT NULL, -- 'data_corruption', 'service_outage', 'security_breach', etc.
  severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Event timeline
  "detectedAt" TIMESTAMP NOT NULL,
  "acknowledgedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "rto" INTEGER, -- Recovery Time Objective (minutes)
  "rpo" INTEGER, -- Recovery Point Objective (minutes)
  "actualRecoveryTime" INTEGER, -- Actual time taken (minutes)
  
  -- Event details
  description TEXT NOT NULL,
  "rootCause" TEXT,
  "affectedSystems" TEXT[],
  "dataLoss" BOOLEAN DEFAULT false,
  "dataLossEstimate" TEXT,
  
  -- Response
  "responseActions" JSONB, -- Array of actions taken
  "restoredBackups" TEXT[], -- Array of backup filenames used
  "incidentCommander" VARCHAR(255),
  "responders" TEXT[],
  
  -- Post-mortem
  "lessonsLearned" TEXT,
  "preventiveMeasures" TEXT,
  "postMortemUrl" TEXT,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Backup verification results table
CREATE TABLE IF NOT EXISTS backup_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "backupId" UUID NOT NULL REFERENCES backup_history(id) ON DELETE CASCADE,
  
  -- Verification details
  "verificationType" VARCHAR(50) CHECK ("verificationType" IN ('integrity', 'restore_test', 'age_check', 'size_check')),
  "verificationStatus" VARCHAR(50) CHECK ("verificationStatus" IN ('passed', 'failed', 'warning')),
  "verificationMessage" TEXT,
  
  -- Test restore details (if applicable)
  "testRestoreEnvironment" VARCHAR(50),
  "testRestoreDuration" INTEGER,
  "tablesVerified" INTEGER,
  "rowsVerified" BIGINT,
  
  "verifiedAt" TIMESTAMP DEFAULT NOW(),
  "verifiedBy" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Backup retention policy table
CREATE TABLE IF NOT EXISTS backup_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "backupType" VARCHAR(50) NOT NULL UNIQUE CHECK ("backupType" IN ('daily', 'weekly', 'monthly', 'manual')),
  "retentionDays" INTEGER NOT NULL,
  "minimumCopies" INTEGER DEFAULT 1,
  "storageLocation" VARCHAR(100)[] DEFAULT ARRAY['s3'],
  "autoDelete" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Backup storage metrics table
CREATE TABLE IF NOT EXISTS backup_storage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recordedAt" DATE NOT NULL UNIQUE,
  
  -- Storage statistics
  "totalBackups" INTEGER NOT NULL,
  "totalSizeBytes" BIGINT NOT NULL,
  "dailyBackupCount" INTEGER DEFAULT 0,
  "weeklyBackupCount" INTEGER DEFAULT 0,
  "monthlyBackupCount" INTEGER DEFAULT 0,
  
  -- Costs (if tracked)
  "estimatedMonthlyCost" DECIMAL(10,2),
  "storageProvider" VARCHAR(100),
  
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON backup_history("backupType");
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_restore_history_environment ON restore_history(environment);
CREATE INDEX IF NOT EXISTS idx_restore_history_created ON restore_history("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dr_events_severity ON disaster_recovery_events(severity);
CREATE INDEX IF NOT EXISTS idx_dr_events_detected ON disaster_recovery_events("detectedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_backup_verification_backup ON backup_verification_results("backupId");

-- Row Level Security
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_recovery_events ENABLE ROW LEVEL SECURITY;

-- Allow service role and authenticated admins to read
CREATE POLICY backup_history_read_policy ON backup_history
  FOR SELECT USING (auth.role() IN ('service_role', 'authenticated'));

CREATE POLICY restore_history_read_policy ON restore_history
  FOR SELECT USING (auth.role() IN ('service_role', 'authenticated'));

CREATE POLICY dr_events_read_policy ON disaster_recovery_events
  FOR SELECT USING (auth.role() IN ('service_role', 'authenticated'));

-- Only service role can insert/update
CREATE POLICY backup_history_service_policy ON backup_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY restore_history_service_policy ON restore_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY dr_events_service_policy ON disaster_recovery_events
  FOR ALL USING (auth.role() = 'service_role');

-- Seed default retention policies
INSERT INTO backup_retention_policies ("backupType", "retentionDays", "minimumCopies", "autoDelete")
VALUES 
  ('daily', 7, 1, true),
  ('weekly', 28, 1, true),
  ('monthly', 180, 1, true),
  ('manual', 30, 1, false)
ON CONFLICT ("backupType") DO NOTHING;

-- Create view for backup statistics
CREATE OR REPLACE VIEW backup_statistics AS
SELECT 
  "backupType",
  COUNT(*) as total_backups,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
  ROUND(AVG("fileSizeBytes") / 1024.0 / 1024.0, 2) as avg_size_mb,
  ROUND(SUM("fileSizeBytes") / 1024.0 / 1024.0 / 1024.0, 2) as total_size_gb,
  ROUND(AVG("durationSeconds"), 2) as avg_duration_seconds,
  MAX("createdAt") as last_backup_at
FROM backup_history
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY "backupType";

-- Create view for restore statistics
CREATE OR REPLACE VIEW restore_statistics AS
SELECT 
  environment,
  COUNT(*) as total_restores,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_restores,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_restores,
  ROUND(AVG("durationSeconds") / 60.0, 2) as avg_duration_minutes,
  MAX("createdAt") as last_restore_at
FROM restore_history
WHERE "createdAt" > NOW() - INTERVAL '90 days'
GROUP BY environment;

-- Create function to cleanup old backups
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS TABLE (
  deleted_count INTEGER,
  backup_type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  WITH deleted AS (
    DELETE FROM backup_history bh
    WHERE bh.status = 'completed'
      AND bh."createdAt" < NOW() - (
        SELECT INTERVAL '1 day' * brp."retentionDays"
        FROM backup_retention_policies brp
        WHERE brp."backupType" = bh."backupType"
          AND brp."autoDelete" = true
      )
    RETURNING bh."backupType"
  )
  SELECT 
    COUNT(*)::INTEGER,
    "backupType"
  FROM deleted
  GROUP BY "backupType";
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE backup_history IS 'Tracks all database backup operations';
COMMENT ON TABLE restore_history IS 'Tracks all database restore operations';
COMMENT ON TABLE disaster_recovery_events IS 'Records disaster recovery incidents and responses';
COMMENT ON TABLE backup_verification_results IS 'Stores results of backup integrity checks';
COMMENT ON TABLE backup_retention_policies IS 'Defines retention policies for different backup types';
COMMENT ON TABLE backup_storage_metrics IS 'Daily aggregated metrics for backup storage';
