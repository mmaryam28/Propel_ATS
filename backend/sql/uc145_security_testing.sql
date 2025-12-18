-- UC-145: Security Penetration Testing
-- Tables for tracking security vulnerabilities and audit logs

-- Security vulnerabilities tracking
CREATE TABLE IF NOT EXISTS security_vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vulnerability details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category VARCHAR(100) NOT NULL, -- 'sql_injection', 'xss', 'csrf', 'broken_auth', etc.
  "owaspCategory" VARCHAR(50), -- 'A01', 'A02', etc.
  
  -- Affected components
  "affectedComponent" TEXT, -- 'auth', 'jobs', 'applications', etc.
  "affectedEndpoint" TEXT, -- '/api/auth/login', etc.
  "affectedVersion" VARCHAR(50),
  
  -- CVSS scoring
  "cvssScore" DECIMAL(3,1),
  "cvssVector" TEXT,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix', 'false_positive')),
  "discoveredAt" TIMESTAMP DEFAULT NOW(),
  "discoveredBy" VARCHAR(255),
  "assignedTo" VARCHAR(255),
  "resolvedAt" TIMESTAMP,
  "resolvedBy" VARCHAR(255),
  
  -- Remediation
  "remediationSteps" TEXT,
  "remediationPriority" VARCHAR(20) CHECK ("remediationPriority" IN ('immediate', 'urgent', 'normal', 'low')),
  "estimatedEffort" VARCHAR(50), -- 'hours', 'days', 'weeks'
  
  -- Additional info
  "reproductionSteps" TEXT,
  "proofOfConcept" TEXT,
  "references" TEXT[], -- Array of URLs to resources
  "cveId" VARCHAR(50), -- CVE identifier if applicable
  "githubIssueUrl" TEXT,
  
  -- Metadata
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  "eventType" VARCHAR(100) NOT NULL, -- 'login_attempt', 'unauthorized_access', 'suspicious_activity', etc.
  "eventCategory" VARCHAR(50) NOT NULL CHECK ("eventCategory" IN ('authentication', 'authorization', 'data_access', 'configuration', 'suspicious')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- User/actor information
  "userId" UUID,
  "userEmail" VARCHAR(255),
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  
  -- Request details
  method VARCHAR(10),
  endpoint TEXT,
  "requestBody" JSONB,
  "responseStatus" INTEGER,
  
  -- Security context
  "authenticationMethod" VARCHAR(50), -- 'jwt', 'session', 'api_key', etc.
  "wasSuccessful" BOOLEAN,
  "failureReason" TEXT,
  "detectedThreat" VARCHAR(100), -- 'sql_injection', 'xss_attempt', 'brute_force', etc.
  
  -- Geolocation
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Metadata
  "additionalData" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Penetration test results
CREATE TABLE IF NOT EXISTS penetration_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test details
  "testType" VARCHAR(100) NOT NULL, -- 'owasp_top_10', 'sql_injection', 'xss', 'api_security', etc.
  "testName" TEXT NOT NULL,
  "testDescription" TEXT,
  
  -- Test execution
  "testedEndpoint" TEXT,
  "testedComponent" VARCHAR(100),
  "testPayload" TEXT,
  "testMethod" VARCHAR(100), -- 'automated', 'manual'
  "testTool" VARCHAR(100), -- 'owasp_zap', 'burp_suite', 'manual', etc.
  
  -- Results
  result VARCHAR(50) NOT NULL CHECK (result IN ('passed', 'failed', 'vulnerable', 'not_applicable', 'error')),
  "vulnerabilityFound" BOOLEAN DEFAULT false,
  "vulnerabilityId" UUID REFERENCES security_vulnerabilities(id),
  
  -- Evidence
  "requestDetails" JSONB,
  "responseDetails" JSONB,
  "screenshot" TEXT, -- URL to screenshot
  "evidence" TEXT,
  
  -- Test metadata
  "testedBy" VARCHAR(255),
  "testedAt" TIMESTAMP DEFAULT NOW(),
  environment VARCHAR(50) CHECK (environment IN ('staging', 'production', 'development')),
  "testDuration" INTEGER, -- Seconds
  
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Security scan results (automated scans)
CREATE TABLE IF NOT EXISTS security_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scan details
  "scanType" VARCHAR(100) NOT NULL, -- 'dependency', 'code_analysis', 'zap', 'secrets', etc.
  "scanTool" VARCHAR(100) NOT NULL, -- 'npm_audit', 'snyk', 'owasp_zap', 'trufflehog', etc.
  "scanTarget" TEXT, -- 'backend', 'frontend', 'staging_url', etc.
  
  -- Results summary
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'failed', 'in_progress', 'cancelled')),
  "totalIssues" INTEGER DEFAULT 0,
  "criticalIssues" INTEGER DEFAULT 0,
  "highIssues" INTEGER DEFAULT 0,
  "mediumIssues" INTEGER DEFAULT 0,
  "lowIssues" INTEGER DEFAULT 0,
  "infoIssues" INTEGER DEFAULT 0,
  
  -- Scan execution
  "startedAt" TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "durationSeconds" INTEGER,
  "triggeredBy" VARCHAR(255), -- 'github_actions', 'manual', 'scheduled'
  
  -- Results
  "findings" JSONB, -- Detailed findings from scan
  "reportUrl" TEXT,
  "githubActionRunId" VARCHAR(100),
  
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Security incidents
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "incidentType" VARCHAR(100) NOT NULL, -- 'data_breach', 'unauthorized_access', 'ddos', etc.
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- Timeline
  "detectedAt" TIMESTAMP NOT NULL,
  "acknowledgedAt" TIMESTAMP,
  "containedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  
  -- Impact
  "affectedUsers" INTEGER,
  "affectedData" TEXT[],
  "dataCompromised" BOOLEAN DEFAULT false,
  "servicesAffected" TEXT[],
  
  -- Response
  "incidentCommander" VARCHAR(255),
  "responseTeam" TEXT[],
  "responseActions" JSONB, -- Array of actions taken
  "communicationsSent" JSONB, -- Record of notifications sent
  
  -- Root cause
  "rootCause" TEXT,
  "vulnerabilityIds" UUID[], -- Related vulnerabilities
  
  -- Post-incident
  "postMortemUrl" TEXT,
  "lessonsLearned" TEXT,
  "preventiveMeasures" JSONB,
  
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'contained', 'resolved', 'closed')),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Rate limit violations log
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  "ipAddress" VARCHAR(45) NOT NULL,
  "userId" UUID,
  endpoint TEXT NOT NULL,
  "requestCount" INTEGER NOT NULL,
  "rateLimit" INTEGER NOT NULL,
  "windowMinutes" INTEGER NOT NULL,
  "userAgent" TEXT,
  "wasBlocked" BOOLEAN DEFAULT true,
  
  "violatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_status ON security_vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_severity ON security_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_category ON security_vulnerabilities(category);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_discovered ON security_vulnerabilities("discoveredAt" DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs("eventType");
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip ON security_audit_logs("ipAddress");
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON security_audit_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_threat ON security_audit_logs("detectedThreat") WHERE "detectedThreat" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_penetration_test_results_type ON penetration_test_results("testType");
CREATE INDEX IF NOT EXISTS idx_penetration_test_results_result ON penetration_test_results(result);
CREATE INDEX IF NOT EXISTS idx_penetration_test_results_tested ON penetration_test_results("testedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_security_scan_results_type ON security_scan_results("scanType");
CREATE INDEX IF NOT EXISTS idx_security_scan_results_started ON security_scan_results("startedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_security_scan_results_status ON security_scan_results(status);

CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_detected ON security_incidents("detectedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations("ipAddress");
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_violated ON rate_limit_violations("violatedAt" DESC);

-- Row Level Security
ALTER TABLE security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Only service role and security team can access
CREATE POLICY security_vulnerabilities_policy ON security_vulnerabilities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY security_audit_logs_policy ON security_audit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY security_incidents_policy ON security_incidents
  FOR ALL USING (auth.role() = 'service_role');

-- Create views for security dashboards
CREATE OR REPLACE VIEW security_vulnerability_summary AS
SELECT 
  severity,
  status,
  COUNT(*) as count,
  AVG("cvssScore") as avg_cvss_score
FROM security_vulnerabilities
WHERE "discoveredAt" > NOW() - INTERVAL '90 days'
GROUP BY severity, status;

CREATE OR REPLACE VIEW security_audit_summary AS
SELECT 
  DATE("createdAt") as date,
  "eventCategory",
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE "detectedThreat" IS NOT NULL) as threat_detections,
  COUNT(DISTINCT "ipAddress") as unique_ips
FROM security_audit_logs
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt"), "eventCategory";

CREATE OR REPLACE VIEW recent_security_issues AS
SELECT 
  'vulnerability' as type,
  title,
  severity,
  status,
  "discoveredAt" as detected_at
FROM security_vulnerabilities
WHERE status IN ('open', 'in_progress')

UNION ALL

SELECT 
  'incident' as type,
  title,
  severity,
  status,
  "detectedAt" as detected_at
FROM security_incidents
WHERE status IN ('open', 'contained')

ORDER BY detected_at DESC
LIMIT 50;

COMMENT ON TABLE security_vulnerabilities IS 'Tracks discovered security vulnerabilities and their remediation';
COMMENT ON TABLE security_audit_logs IS 'Logs security-relevant events and suspicious activities';
COMMENT ON TABLE penetration_test_results IS 'Stores results from penetration testing activities';
COMMENT ON TABLE security_scan_results IS 'Stores results from automated security scans';
COMMENT ON TABLE security_incidents IS 'Tracks security incidents and response activities';
COMMENT ON TABLE rate_limit_violations IS 'Logs rate limit violations for abuse detection';
