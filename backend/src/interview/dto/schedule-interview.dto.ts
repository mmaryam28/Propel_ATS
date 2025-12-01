import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class ScheduleInterviewDto {
  // Required fields
  @IsString()
  company_name: string;

  @IsDateString()
  interview_date: string;

  @IsString()
  interview_type: string;

  @IsString()
  interview_format: string;

  // Optional fields
  @IsOptional()
  @IsString()
  interviewer_name?: string;

  @IsOptional()
  @IsString()
  interviewer_email?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  interview_stage?: string | null;

  @IsOptional()
  @IsNumber()
  prep_time_hours?: number;

  // New optional fields based on your table
  @IsOptional()
  @IsNumber()
  job_application_id?: number;

  @IsOptional()
  @IsString()
  job_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
