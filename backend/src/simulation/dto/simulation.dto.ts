import { IsString, IsInt, IsOptional, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';

export enum RiskTolerance {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
}

export enum Scenario {
  BEST = 'best',
  AVERAGE = 'average',
  WORST = 'worst',
}

export class CreateSimulationDto {
  @IsString()
  simulationName: string;

  @IsString()
  startingRole: string;

  @IsInt()
  @Min(0)
  startingSalary: number;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  companySize?: string;

  @IsInt()
  @Min(5)
  @Max(20)
  @IsOptional()
  simulationYears?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  workLifeBalanceWeight?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  salaryWeight?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  learningWeight?: number;

  @IsEnum(RiskTolerance)
  @IsOptional()
  riskTolerance?: RiskTolerance;

  // Optional: Start from existing job or offer
  @IsString()
  @IsOptional()
  jobId?: string;

  @IsString()
  @IsOptional()
  offerId?: string;
}

export class UpdateSimulationDto {
  @IsString()
  @IsOptional()
  simulationName?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  workLifeBalanceWeight?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  salaryWeight?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  learningWeight?: number;

  @IsEnum(RiskTolerance)
  @IsOptional()
  riskTolerance?: RiskTolerance;
}

export interface CareerSnapshot {
  year: number;
  roleTitle: string;
  companyType: string;
  salary: number;
  totalComp: number;
  skillsAcquired: string[];
  probabilityScore: number;
  satisfactionScore: number;
}

export interface DecisionPoint {
  year: number;
  title: string;
  description: string;
  options: {
    choice: string;
    impact: string;
    salaryDelta: number;
    satisfactionDelta: number;
  }[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'skills' | 'role' | 'industry' | 'education';
  timeframe: string;
  expectedImpact: string;
}

export interface SimulationResponse {
  id: string;
  userId: string;
  simulationName: string;
  startingRole: string;
  startingSalary: number;
  industry: string;
  companySize: string;
  simulationYears: number;
  
  workLifeBalanceWeight: number;
  salaryWeight: number;
  learningWeight: number;
  riskTolerance: RiskTolerance;
  
  bestCaseTrajectory: CareerSnapshot[];
  averageCaseTrajectory: CareerSnapshot[];
  worstCaseTrajectory: CareerSnapshot[];
  
  lifetimeEarningsBest: number;
  lifetimeEarningsAvg: number;
  lifetimeEarningsWorst: number;
  
  decisionPoints: DecisionPoint[];
  recommendations: Recommendation[];
  
  createdAt: string;
  updatedAt: string;
}

export interface IndustryTrend {
  industry: string;
  year: number;
  growthRate: number;
  avgSalaryIncrease: number;
  jobMarketScore: number;
  economicOutlook: string;
}

export interface CareerRoleTemplate {
  id: string;
  roleName: string;
  industry: string;
  level: number;
  typicalYearsToNext: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  nextRoleIds: string[];
  skillsRequired: string[];
}
