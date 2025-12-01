import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, IsUUID, Min, Max } from 'class-validator';

export class CreateTimeEntryDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['application', 'interview_prep', 'networking', 'skill_development', 'research', 'follow_up', 'resume_writing', 'cover_letter'])
  activity_type: string;

  @IsUUID()
  @IsOptional()
  job_id?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  duration_minutes: number;

  @IsDateString()
  @IsNotEmpty()
  start_time: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  energy_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  productivity_rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTimeEntryDto {
  @IsString()
  @IsOptional()
  @IsEnum(['application', 'interview_prep', 'networking', 'skill_development', 'research', 'follow_up', 'resume_writing', 'cover_letter'])
  activity_type?: string;

  @IsUUID()
  @IsOptional()
  job_id?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  duration_minutes?: number;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  energy_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  productivity_rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
