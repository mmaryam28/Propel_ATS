import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class ScheduleInterviewDto {
  @IsString()
  company_name: string;

  @IsDateString()
  interview_date: string;

  @IsString()
  interview_type: string;

  @IsString()
  interview_format: string;

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
  prep_time_hours?: number | null;

  // Keep status but optional
  @IsOptional()
  @IsString()
  status?: string | null;
}
