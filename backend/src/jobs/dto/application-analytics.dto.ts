export interface SuccessRateData {
  total: number;
  applied: number;
  responded: number;
  interviewed: number;
  offered: number;
  rejected: number;
  responseRate: string;
  interviewRate: string;
  offerRate: string;
}

export interface SuccessRatesByCategory {
  byIndustry: Record<string, SuccessRateData>;
  byCompanySize: Record<string, SuccessRateData>;
  byRoleType: Record<string, SuccessRateData>;
  overall: SuccessRateData;
}

export interface MethodPerformance {
  byMethod: Record<string, SuccessRateData>;
  bySource: Record<string, SuccessRateData>;
}

export interface PatternData {
  totalCount: number;
  topIndustries: Array<{ industry: string; count: number }>;
  companySizeDistribution: Record<string, number>;
  topSources: Array<{ source: string; count: number }>;
}

export interface SuccessPatterns {
  successful: PatternData;
  rejected: PatternData;
  comparison: Array<{
    type: string;
    insight: string;
  }>;
}

export interface MaterialStats {
  total: number;
  responded: number;
  interviewed: number;
  offered: number;
  responseRate: string;
  interviewRate: string;
  offerRate: string;
}

export interface MaterialImpact {
  resumeImpact: {
    customized: MaterialStats;
    standard: MaterialStats;
    improvement: {
      responseRateDiff: string;
      improvement: 'positive' | 'negative' | 'none';
    };
  };
  coverLetterImpact: {
    customized: MaterialStats;
    standard: MaterialStats;
    improvement: {
      responseRateDiff: string;
      improvement: 'positive' | 'negative' | 'none';
    };
  };
  fullyCustomizedImpact: MaterialStats;
  statisticalSignificance: {
    significant: boolean;
    confidence: string;
    p_value?: string;
    z_score?: string;
    reason?: string;
  };
}

export interface CustomizationImpact {
  summary: {
    resumeCustomization: MaterialImpact['resumeImpact'];
    coverLetterCustomization: MaterialImpact['coverLetterImpact'];
    bothCustomized: MaterialStats;
  };
  recommendation: string;
}

export interface TimingData {
  total: number;
  responded: number;
  responseRate: string;
}

export interface TimingPatterns {
  byDayOfWeek: Record<string, TimingData>;
  byTimeOfDay: Record<string, TimingData>;
  optimalTiming: {
    bestDay: { day: string; responseRate: string } | null;
    bestTimeSlot: { slot: string; responseRate: string } | null;
  };
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  data: any;
  actionItems: string[];
}

export interface Recommendations {
  recommendations: Recommendation[];
  overallScore: number;
}

export interface DashboardData {
  successRates: SuccessRatesByCategory;
  methodPerformance: MethodPerformance;
  patterns: SuccessPatterns;
  materialImpact: MaterialImpact;
  customizationImpact: CustomizationImpact;
  timingPatterns: TimingPatterns;
  recommendations: Recommendations;
}
