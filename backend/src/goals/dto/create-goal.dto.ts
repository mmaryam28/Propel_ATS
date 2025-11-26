import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, IsArray, Min, Max } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['job_search', 'skill_development', 'networking', 'career_advancement', 'interview_preparation', 'salary_negotiation'])
  category: string;

  @IsString()
  @IsNotEmpty()
  goal_type: string; // Legacy field - specific type within category

  @IsString()
  @IsNotEmpty()
  @IsEnum(['count', 'percentage', 'boolean', 'numeric'])
  metric_type: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  target: number;

  @IsString()
  @IsOptional()
  unit?: string; // 'applications', 'interviews', 'skills', 'connections', etc.

  @IsString()
  @IsNotEmpty()
  @IsEnum(['high', 'medium', 'low'])
  priority: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  target_date: string;

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
