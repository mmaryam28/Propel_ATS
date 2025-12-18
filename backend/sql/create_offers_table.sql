-- UC-127: Offer Evaluation & Comparison Tool
-- Table to store job offers with all compensation and evaluation details

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  job_id UUID NULL REFERENCES public.jobs(id) ON DELETE SET NULL,
  
  -- Basic Info
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT NOT NULL,
  remote_policy TEXT, -- 'fully_remote', 'hybrid', 'onsite'
  
  -- Compensation
  base_salary DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  bonus DECIMAL(12, 2) DEFAULT 0,
  signing_bonus DECIMAL(12, 2) DEFAULT 0,
  equity_value DECIMAL(12, 2) DEFAULT 0,
  equity_type TEXT, -- 'RSU', 'Stock Options', 'ISO', 'NSO'
  equity_vesting_years INTEGER,
  
  -- Benefits
  health_insurance_value DECIMAL(10, 2) DEFAULT 0,
  retirement_match_percent DECIMAL(5, 2), -- e.g., 6.00 for 6%
  retirement_match_value DECIMAL(10, 2),
  pto_days INTEGER,
  pto_value DECIMAL(10, 2),
  other_benefits JSONB, -- {gym: 1200, education: 5000, etc}
  
  -- Calculated Values
  total_compensation DECIMAL(12, 2),
  col_adjusted_salary DECIMAL(12, 2), -- Cost of living adjusted
  col_index DECIMAL(5, 2), -- Cost of living index for location
  
  -- Non-Financial Scoring (0-10)
  culture_fit_score INTEGER CHECK (culture_fit_score >= 0 AND culture_fit_score <= 10),
  growth_opportunities_score INTEGER CHECK (growth_opportunities_score >= 0 AND growth_opportunities_score <= 10),
  work_life_balance_score INTEGER CHECK (work_life_balance_score >= 0 AND work_life_balance_score <= 10),
  team_quality_score INTEGER CHECK (team_quality_score >= 0 AND team_quality_score <= 10),
  mission_alignment_score INTEGER CHECK (mission_alignment_score >= 0 AND mission_alignment_score <= 10),
  
  -- Weighted Total Score
  weighted_score DECIMAL(5, 2),
  
  -- Decision & Notes
  status TEXT DEFAULT 'evaluating', -- 'evaluating', 'accepted', 'declined', 'negotiating'
  offer_deadline DATE,
  negotiation_notes TEXT,
  decline_reason TEXT,
  pros TEXT,
  cons TEXT,
  notes TEXT,
  
  -- Timestamps
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_job_id ON public.offers(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- Comments
COMMENT ON TABLE public.offers IS 'Job offers with comprehensive compensation and evaluation details';
COMMENT ON COLUMN public.offers.col_index IS 'Cost of living index (100 = baseline)';
COMMENT ON COLUMN public.offers.weighted_score IS 'Weighted score combining financial and non-financial factors';
