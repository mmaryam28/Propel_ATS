import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class ScheduleInterviewDto {
  @IsString()
  jobId: string;

  @IsString()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  duration?: string; // e.g., "60" for 60 minutes

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  interviewerName?: string;

  @IsOptional()
  @IsString()
  interviewerEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  setReminder?: boolean;

  @IsOptional()
  @IsString()
  reminderBefore?: string; // e.g., "1h", "1d"
}

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  interviewerName?: string;

  @IsOptional()
  @IsString()
  interviewerEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'scheduled', 'completed', 'cancelled'
}
