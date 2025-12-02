// Activity Volume Metrics (AC1)
export interface ActivityVolumeMetrics {
  total_activities: number;
  activities_by_type: { [key: string]: number };
  monthly_trend: Array<{ month: string; count: number }>;
  avg_per_week: number;
  most_active_period: string;
}

// Referral Metrics (AC2)
export interface ReferralMetrics {
  total_referrals_given: number;
  total_referrals_received: number;
  job_opportunities_sourced: number;
  conversion_rate: number;
  top_referral_sources: Array<{
    contact_name: string;
    referrals_count: number;
  }>;
}

// Relationship Analysis (AC3)
export interface RelationshipAnalysis {
  total_contacts: number;
  contacts_by_strength: { [key: string]: number };
  engagement_quality_score: number;
  relationship_growth_trend: Array<{ month: string; new_contacts: number }>;
  strong_relationships: number;
  dormant_contacts: Array<{
    contact_name: string;
    days_since_last_contact: number;
  }>;
}

// Event ROI Metrics (AC4)
export interface EventROIMetrics {
  events_attended: number;
  total_cost: number;
  total_leads: number;
  average_roi: number;
  best_event_types: Array<{
    event_type: string;
    avg_roi: number;
    avg_leads: number;
  }>;
  recent_events: Array<{
    event_name: string;
    event_date: string;
    roi_score: number;
    contacts_made: number;
  }>;
}

// Value Exchange Metrics (AC5)
export interface ValueExchangeMetrics {
  total_value_given: number;
  total_value_received: number;
  value_balance: number;
  reciprocity_index: number;
  giving_score: number;
  receiving_score: number;
  top_mutual_contacts: Array<{
    contact_name: string;
    mutual_value_score: number;
  }>;
}

// Networking Insights (AC7)
export interface NetworkingInsights {
  best_performing_strategies: Array<{
    strategy: string;
    success_rate: number;
    recommendation: string;
  }>;
  optimization_recommendations: string[];
  time_allocation_suggestions: { [key: string]: number };
  contact_quality_vs_quantity_score: number;
}

// Industry Benchmarks (AC8)
export interface BenchmarkData {
  user_industry: string;
  avg_network_size: number;
  user_network_size: number;
  avg_activities_per_month: number;
  user_activities_per_month: number;
  avg_referral_rate: number;
  user_referral_rate: number;
  best_practices: string[];
  industry_insights: string[];
}

// Complete Dashboard
export interface NetworkingDashboard {
  activity_volume: ActivityVolumeMetrics;
  referral_metrics: ReferralMetrics;
  relationship_analysis: RelationshipAnalysis;
  event_roi: EventROIMetrics;
  value_exchange: ValueExchangeMetrics;
  insights: NetworkingInsights;
  benchmarks: BenchmarkData;
}
