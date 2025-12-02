import { IsString, IsOptional, IsInt, IsDateString, IsBoolean, IsNumber } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsOptional()
  contact_id?: string;

  @IsString()
  activity_type: string; // message, call, meeting, event, coffee_chat, introduction

  @IsDateString()
  activity_date: string;

  @IsInt()
  @IsOptional()
  duration_minutes?: number;

  @IsString()
  @IsOptional()
  outcome?: string; // positive, neutral, negative, no_response

  @IsString()
  @IsOptional()
  value_exchange?: string; // job_lead, advice, referral, information, support

  @IsString()
  @IsOptional()
  event_name?: string;

  @IsNumber()
  @IsOptional()
  event_cost?: number;

  @IsBoolean()
  @IsOptional()
  follow_up_required?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  contact_id?: string;

  @IsString()
  @IsOptional()
  activity_type?: string;

  @IsDateString()
  @IsOptional()
  activity_date?: string;

  @IsInt()
  @IsOptional()
  duration_minutes?: number;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsString()
  @IsOptional()
  value_exchange?: string;

  @IsString()
  @IsOptional()
  event_name?: string;

  @IsNumber()
  @IsOptional()
  event_cost?: number;

  @IsBoolean()
  @IsOptional()
  follow_up_required?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
