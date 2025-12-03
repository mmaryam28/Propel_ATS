// DTOs for Success Pattern Recognition (UC-105)

export interface ApplicationSuccessPatterns {
  total_applications: number;
  total_offers: number;
  overall_success_rate: number;
  successful_job_types: Array<{ job_type: string; success_rate: number; count: number }>;
  top_companies: Array<{ company: string; success_rate: number; applications: number }>;
  winning_industries: Array<{ industry: string; offer_rate: number }>;
  application_to_offer_conversion: number;
}

export interface PreparationCorrelation {
  avg_prep_hours_successful: number;
  avg_prep_hours_unsuccessful: number;
  correlation_score: number; // -1 to 1
  most_effective_activities: Array<{ activity: string; success_rate: number }>;
  optimal_prep_time_range: { min: number; max: number };
  prep_impact_level: string; // 'high', 'medium', 'low'
}

export interface TimingPatterns {
  best_application_days: Array<{ day: string; success_rate: number }>;
  best_months: Array<{ month: string; response_rate: number }>;
  optimal_followup_timing: { days: number; success_rate: number };
  avg_time_to_response: number; // days
  avg_time_to_offer: number; // days
  seasonal_trends: Array<{ quarter: string; success_rate: number }>;
}

export interface StrategyEffectiveness {
  strategy_success_rates: Array<{ strategy: string; success_rate: number; sample_size: number }>;
  market_condition_strategies: Array<{
    market_condition: string;
    best_strategy: string;
    success_rate: number;
  }>;
  effectiveness_trends: Array<{ month: string; strategy: string; success_rate: number }>;
  recommended_strategy: string;
}

export interface PersonalSuccessFactors {
  winning_skills: Array<{ skill: string; appearance_in_offers: number }>;
  best_resume_version: { version: string; success_rate: number };
  effective_customization_level: string; // 'high', 'medium', 'low'
  successful_job_characteristics: {
    avg_salary_range: { min: number; max: number };
    remote_vs_onsite: { remote: number; onsite: number; hybrid: number };
    company_sizes: Array<{ size: string; count: number }>;
  };
  your_competitive_advantage: string[];
}

export interface PredictiveModel {
  opportunity_id: string;
  success_probability: number; // 0-100
  confidence_level: string; // 'high', 'medium', 'low'
  key_factors: Array<{
    factor: string;
    impact: string; // 'positive', 'negative', 'neutral'
    weight: number;
  }>;
  similar_past_applications: Array<{
    company: string;
    position: string;
    outcome: string;
    similarity_score: number;
  }>;
  recommendation: string;
}

export interface Recommendations {
  priority_actions: Array<{ action: string; impact: string; effort: string }>;
  focus_areas: string[];
  strategy_adjustments: Array<{ current: string; suggested: string; reason: string }>;
  skill_gaps: string[];
  networking_opportunities: string[];
  timing_suggestions: string[];
}

export interface PatternEvolution {
  timeframe: string;
  pattern_changes: Array<{
    pattern_type: string;
    previous_value: number;
    current_value: number;
    change_percentage: number;
    trend: string; // 'improving', 'declining', 'stable'
  }>;
  strategy_adaptations: Array<{ date: string; strategy_change: string; result: string }>;
  improvement_trends: Array<{ metric: string; trend_data: Array<{ month: string; value: number }> }>;
  success_rate_evolution: Array<{ period: string; success_rate: number }>;
}

export interface PatternsDashboard {
  application_patterns: ApplicationSuccessPatterns;
  preparation_correlation: PreparationCorrelation;
  timing_patterns: TimingPatterns;
  strategy_effectiveness: StrategyEffectiveness;
  success_factors: PersonalSuccessFactors;
  recommendations: Recommendations;
  evolution: PatternEvolution;
}
