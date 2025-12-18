-- UC-128: Career Path Simulation
-- Tables for modeling career trajectories and simulation results

-- Industry trends and economic data
CREATE TABLE IF NOT EXISTS industry_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  "growthRate" DECIMAL(5,2), -- Percentage growth rate
  "avgSalaryIncrease" DECIMAL(5,2), -- Average salary increase %
  "jobMarketScore" DECIMAL(3,2), -- 0-10 scale
  "economicOutlook" VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
  "dataSource" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE(industry, year)
);

-- Career role progression templates (e.g., Junior → Mid → Senior → Lead)
CREATE TABLE IF NOT EXISTS career_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleName" VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  level INTEGER NOT NULL, -- 1=Entry, 2=Junior, 3=Mid, 4=Senior, 5=Lead, 6=Principal, 7=Executive
  "typicalYearsToNext" INTEGER, -- Years typically spent at this level
  "avgSalaryMin" INTEGER,
  "avgSalaryMax" INTEGER,
  "nextRoleIds" UUID[], -- Array of possible next role IDs
  "skillsRequired" TEXT[],
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- User's career simulations
CREATE TABLE IF NOT EXISTS career_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "simulationName" VARCHAR(255) NOT NULL,
  "startingRole" VARCHAR(255) NOT NULL,
  "startingSalary" INTEGER NOT NULL,
  industry VARCHAR(255),
  "companySize" VARCHAR(50), -- 'startup', 'small', 'medium', 'large', 'enterprise'
  "simulationYears" INTEGER DEFAULT 10, -- 5 or 10 years
  
  -- User's custom preferences
  "workLifeBalanceWeight" DECIMAL(3,2) DEFAULT 0.33,
  "salaryWeight" DECIMAL(3,2) DEFAULT 0.33,
  "learningWeight" DECIMAL(3,2) DEFAULT 0.34,
  "riskTolerance" VARCHAR(20) DEFAULT 'moderate', -- 'low', 'moderate', 'high'
  
  -- Results (JSON for flexibility)
  "bestCaseTrajectory" JSONB,
  "averageCaseTrajectory" JSONB,
  "worstCaseTrajectory" JSONB,
  
  "lifetimeEarningsBest" BIGINT,
  "lifetimeEarningsAvg" BIGINT,
  "lifetimeEarningsWorst" BIGINT,
  
  "decisionPoints" JSONB, -- Key career decision points
  recommendations JSONB, -- Recommended next steps
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT career_simulations_userid_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

-- Career path snapshots (yearly progression for a simulation)
CREATE TABLE IF NOT EXISTS career_path_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  year INTEGER NOT NULL, -- Year in simulation (0-10)
  scenario VARCHAR(20) NOT NULL, -- 'best', 'average', 'worst'
  
  "roleTitle" VARCHAR(255) NOT NULL,
  "companyType" VARCHAR(50),
  salary INTEGER NOT NULL,
  "totalComp" INTEGER, -- Including stock, bonus, etc.
  
  "skillsAcquired" TEXT[],
  "probabilityScore" DECIMAL(5,2), -- Probability of reaching this state
  "satisfactionScore" DECIMAL(3,2), -- Predicted satisfaction (0-10)
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT career_path_snapshots_simulation_fkey FOREIGN KEY ("simulationId") 
    REFERENCES career_simulations(id) ON DELETE CASCADE,
  UNIQUE("simulationId", year, scenario)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_trends_industry ON industry_trends(industry);
CREATE INDEX IF NOT EXISTS idx_career_role_templates_industry ON career_role_templates(industry, level);
CREATE INDEX IF NOT EXISTS idx_career_simulations_userid ON career_simulations("userId");
CREATE INDEX IF NOT EXISTS idx_career_path_snapshots_simulation ON career_path_snapshots("simulationId");

-- Row Level Security
ALTER TABLE career_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_path_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see their own simulations
CREATE POLICY career_simulations_user_policy ON career_simulations
  FOR ALL USING ("userId" = auth.uid());

-- Users can only see snapshots from their own simulations
CREATE POLICY career_path_snapshots_user_policy ON career_path_snapshots
  FOR ALL USING (
    "simulationId" IN (
      SELECT id FROM career_simulations WHERE "userId" = auth.uid()
    )
  );

-- Seed some basic industry trends data (2024-2034)
INSERT INTO industry_trends (industry, year, "growthRate", "avgSalaryIncrease", "jobMarketScore", "economicOutlook", "dataSource")
VALUES 
  ('Technology', 2024, 8.5, 5.2, 8.5, 'excellent', 'Bureau of Labor Statistics'),
  ('Technology', 2025, 8.0, 5.0, 8.3, 'excellent', 'Bureau of Labor Statistics'),
  ('Technology', 2026, 7.5, 4.8, 8.0, 'good', 'Projected'),
  ('Finance', 2024, 4.2, 3.8, 7.0, 'good', 'Bureau of Labor Statistics'),
  ('Finance', 2025, 4.0, 3.5, 6.8, 'good', 'Bureau of Labor Statistics'),
  ('Healthcare', 2024, 6.5, 4.2, 8.2, 'excellent', 'Bureau of Labor Statistics'),
  ('Healthcare', 2025, 6.8, 4.5, 8.5, 'excellent', 'Bureau of Labor Statistics'),
  ('Consulting', 2024, 5.5, 4.0, 7.5, 'good', 'Bureau of Labor Statistics'),
  ('Education', 2024, 3.0, 2.5, 6.0, 'fair', 'Bureau of Labor Statistics'),
  ('Manufacturing', 2024, 2.5, 2.8, 5.5, 'fair', 'Bureau of Labor Statistics')
ON CONFLICT (industry, year) DO NOTHING;

-- Seed some career role templates for Software Engineering track
INSERT INTO career_role_templates ("roleName", industry, level, "typicalYearsToNext", "avgSalaryMin", "avgSalaryMax", "skillsRequired")
VALUES 
  ('Junior Software Engineer', 'Technology', 2, 2, 60000, 85000, ARRAY['Programming', 'Git', 'Testing']),
  ('Software Engineer', 'Technology', 3, 3, 85000, 120000, ARRAY['System Design', 'Databases', 'APIs']),
  ('Senior Software Engineer', 'Technology', 4, 4, 120000, 170000, ARRAY['Architecture', 'Mentoring', 'Leadership']),
  ('Staff Engineer', 'Technology', 5, 4, 170000, 230000, ARRAY['Strategic Planning', 'Cross-team Leadership']),
  ('Principal Engineer', 'Technology', 6, 5, 230000, 350000, ARRAY['Technical Vision', 'Organization Impact']),
  ('Engineering Manager', 'Technology', 4, 3, 130000, 180000, ARRAY['People Management', 'Project Planning']),
  ('Senior Engineering Manager', 'Technology', 5, 4, 180000, 250000, ARRAY['Team Building', 'Budget Management']),
  ('Director of Engineering', 'Technology', 6, 5, 250000, 400000, ARRAY['Strategic Leadership', 'Org Design']),
  ('VP of Engineering', 'Technology', 7, 0, 350000, 600000, ARRAY['Executive Leadership', 'Business Strategy'])
ON CONFLICT DO NOTHING;

-- Seed Finance career track
INSERT INTO career_role_templates ("roleName", industry, level, "typicalYearsToNext", "avgSalaryMin", "avgSalaryMax", "skillsRequired")
VALUES 
  ('Financial Analyst', 'Finance', 2, 2, 55000, 75000, ARRAY['Financial Modeling', 'Excel', 'Analysis']),
  ('Senior Financial Analyst', 'Finance', 3, 3, 75000, 105000, ARRAY['Advanced Modeling', 'Reporting']),
  ('Finance Manager', 'Finance', 4, 4, 105000, 145000, ARRAY['Team Management', 'Strategy']),
  ('Senior Finance Manager', 'Finance', 5, 4, 145000, 195000, ARRAY['Budget Planning', 'Leadership']),
  ('Finance Director', 'Finance', 6, 5, 195000, 280000, ARRAY['Strategic Planning', 'Executive Communication']),
  ('CFO', 'Finance', 7, 0, 280000, 500000, ARRAY['Executive Leadership', 'Corporate Finance'])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE career_simulations IS 'Stores user career path simulations with projections';
COMMENT ON TABLE career_path_snapshots IS 'Year-by-year snapshots of simulated career progression';
COMMENT ON TABLE industry_trends IS 'Industry growth trends and economic data for modeling';
COMMENT ON TABLE career_role_templates IS 'Template career paths showing typical progression';
