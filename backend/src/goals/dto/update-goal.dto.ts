import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsArray, IsBoolean, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['job_search', 'skill_development', 'networking', 'career_advancement', 'interview_preparation', 'salary_negotiation'])
  category?: string;

  @IsString()
  @IsOptional()
  goal_type?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['count', 'percentage', 'boolean', 'numeric'])
  metric_type?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  target?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  progress?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['not_started', 'in_progress', 'completed', 'abandoned'])
  status?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  target_date?: string;

  @IsDateString()
  @IsOptional()
  completed_date?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  why_important?: string;

  @IsString()
  @IsOptional()
  celebration_message?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  shared_with?: string[];
}

export class UpdateProgressDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  progress: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
