export interface TimeBreakdown {
  activity_type: string;
  total_minutes: number;
  percentage: number;
  entry_count: number;
  avg_duration: number;
}

export interface ProductivityPattern {
  hour: number;
  day_of_week: string;
  avg_productivity: number;
  avg_energy: number;
  total_entries: number;
}

export interface EfficiencyMetric {
  activity_type: string;
  avg_time_per_task: number;
  completion_rate: number;
  productivity_score: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ROIAnalysis {
  activity_type: string;
  time_invested_minutes: number;
  outcomes_generated: number;
  success_rate: number;
  roi_score: number;
}

export interface BurnoutIndicator {
  burnout_score: number; // 0-10 scale
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    excessive_hours: boolean;
    low_energy_trend: boolean;
    declining_productivity: boolean;
    lack_of_breaks: boolean;
  };
  work_life_balance_score: number;
  recommendations: string[];
}

export interface EnergyPattern {
  hour: number;
  avg_energy: number;
  productivity_correlation: number;
}

export interface OptimalSchedule {
  best_hours: number[];
  best_days: string[];
  peak_productivity_time: string;
  recommended_schedule: {
    activity_type: string;
    suggested_time: string;
    reason: string;
  }[];
}

export interface TimeOptimizationRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action: string;
  expected_impact: string;
}

export interface ProductivityDashboard {
  summary: {
    total_time_this_week: number;
    total_time_last_week: number;
    productivity_score: number; // 0-100
    burnout_risk: 'low' | 'moderate' | 'high' | 'critical';
    activities_completed: number;
    avg_energy: number;
  };
  time_breakdown: TimeBreakdown[];
  productivity_patterns: ProductivityPattern[];
  efficiency_metrics: EfficiencyMetric[];
  roi_analysis: ROIAnalysis[];
  burnout_indicator: BurnoutIndicator;
  energy_patterns: EnergyPattern[];
  optimal_schedule: OptimalSchedule;
  recommendations: TimeOptimizationRecommendation[];
}
