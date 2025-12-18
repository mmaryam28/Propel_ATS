-- UC-132: CI/CD Pipeline Configuration
-- Deployment tracking and history

-- Deployment history table
CREATE TABLE IF NOT EXISTS deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(50) NOT NULL CHECK (environment IN ('staging', 'production')),
  version VARCHAR(100), -- e.g., 'v2025.01.15-42'
  "commitSha" VARCHAR(40) NOT NULL,
  "commitMessage" TEXT,
  "deployedBy" VARCHAR(255) NOT NULL,
  "deploymentType" VARCHAR(50) DEFAULT 'deploy' CHECK ("deploymentType" IN ('deploy', 'rollback', 'hotfix')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
  
  -- Deployment details
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "durationSeconds" INTEGER,
  
  -- Health check results
  "backendHealthy" BOOLEAN,
  "frontendHealthy" BOOLEAN,
  "healthCheckDetails" JSONB,
  
  -- Rollback information
  "rolledBackFrom" UUID, -- Reference to deployment that was rolled back
  "rollbackReason" TEXT,
  
  -- Build information
  "buildNumber" INTEGER,
  "gitBranch" VARCHAR(100),
  "prNumber" INTEGER,
  
  -- Metrics
  "testsRun" INTEGER,
  "testsPassed" INTEGER,
  "testsFailed" INTEGER,
  "coveragePercentage" DECIMAL(5,2),
  
  -- Logs and errors
  "errorMessage" TEXT,
  "deploymentLogs" TEXT,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT deployment_history_rolled_back_from_fkey 
    FOREIGN KEY ("rolledBackFrom") REFERENCES deployment_history(id)
);

-- Deployment metrics table (aggregated stats)
CREATE TABLE IF NOT EXISTS deployment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(50) NOT NULL,
  
  -- Time period
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  
  -- Deployment stats
  "totalDeployments" INTEGER DEFAULT 0,
  "successfulDeployments" INTEGER DEFAULT 0,
  "failedDeployments" INTEGER DEFAULT 0,
  "rollbacks" INTEGER DEFAULT 0,
  
  -- Performance metrics
  "avgDeploymentTimeSeconds" DECIMAL(10,2),
  "minDeploymentTimeSeconds" INTEGER,
  "maxDeploymentTimeSeconds" INTEGER,
  
  -- Quality metrics
  "avgTestCoverage" DECIMAL(5,2),
  "avgTestsPassed" INTEGER,
  
  -- Reliability
  "uptimePercentage" DECIMAL(5,2),
  "mttr" INTEGER, -- Mean Time To Recovery (seconds)
  "deploymentFrequency" DECIMAL(10,2), -- Deployments per day
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(environment, "periodStart", "periodEnd")
);

-- Deployment notifications table
CREATE TABLE IF NOT EXISTS deployment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deploymentId" UUID NOT NULL REFERENCES deployment_history(id) ON DELETE CASCADE,
  "notificationType" VARCHAR(50) CHECK ("notificationType" IN ('slack', 'email', 'webhook')),
  "recipientChannel" VARCHAR(255), -- Slack channel or email address
  "notificationStatus" VARCHAR(50) CHECK ("notificationStatus" IN ('pending', 'sent', 'failed')),
  "sentAt" TIMESTAMP,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Build artifacts table (track what was deployed)
CREATE TABLE IF NOT EXISTS build_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deploymentId" UUID NOT NULL REFERENCES deployment_history(id) ON DELETE CASCADE,
  "artifactType" VARCHAR(50) CHECK ("artifactType" IN ('frontend', 'backend', 'database_migration')),
  "artifactPath" TEXT,
  "artifactSize" BIGINT, -- Size in bytes
  "artifactHash" VARCHAR(64), -- SHA256 hash
  "buildDuration" INTEGER, -- Seconds
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployment_history_environment ON deployment_history(environment);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(status);
CREATE INDEX IF NOT EXISTS idx_deployment_history_deployed_by ON deployment_history("deployedBy");
CREATE INDEX IF NOT EXISTS idx_deployment_history_created_at ON deployment_history("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_history_commit ON deployment_history("commitSha");
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_period ON deployment_metrics(environment, "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS idx_build_artifacts_deployment ON build_artifacts("deploymentId");

-- Row Level Security (if needed for team access)
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_metrics ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read deployment history
CREATE POLICY deployment_history_read_policy ON deployment_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update deployment records
CREATE POLICY deployment_history_service_policy ON deployment_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY deployment_metrics_read_policy ON deployment_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Seed some example data (optional)
/*
INSERT INTO deployment_history (
  environment, version, "commitSha", "commitMessage", "deployedBy", 
  "deploymentType", status, "completedAt", "durationSeconds",
  "backendHealthy", "frontendHealthy", "testsRun", "testsPassed"
) VALUES 
  ('staging', 'v2025.12.16-1', 'abc123def456', 'feat: Add career simulation feature', 'github-actions', 
   'deploy', 'success', NOW(), 180, true, true, 45, 45),
  ('production', 'v2025.12.15-28', 'def789ghi012', 'fix: Resolve API timeout issue', 'github-actions',
   'deploy', 'success', NOW() - INTERVAL '1 day', 240, true, true, 52, 50);
*/

COMMENT ON TABLE deployment_history IS 'Tracks all deployment events with detailed information';
COMMENT ON TABLE deployment_metrics IS 'Aggregated deployment metrics for reporting and dashboards';
COMMENT ON TABLE deployment_notifications IS 'Tracks notification delivery for deployments';
COMMENT ON TABLE build_artifacts IS 'Stores information about built artifacts for each deployment';
