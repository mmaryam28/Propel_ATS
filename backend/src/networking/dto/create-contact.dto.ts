import { IsString, IsOptional, IsInt, Min, Max, IsDateString, IsNumber } from 'class-validator';

export class CreateContactDto {
  @IsString()
  contact_name: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  job_title?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  connection_source?: string; // linkedin, event, referral, cold_outreach

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  relationship_strength?: number;

  @IsDateString()
  first_contact_date: string;

  @IsDateString()
  @IsOptional()
  last_interaction_date?: string;

  @IsInt()
  @IsOptional()
  total_interactions?: number;

  @IsInt()
  @IsOptional()
  referrals_given?: number;

  @IsInt()
  @IsOptional()
  referrals_received?: number;

  @IsInt()
  @IsOptional()
  job_opportunities_sourced?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  value_provided_score?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  value_received_score?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateContactDto {
  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  job_title?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  connection_source?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  relationship_strength?: number;

  @IsDateString()
  @IsOptional()
  first_contact_date?: string;

  @IsDateString()
  @IsOptional()
  last_interaction_date?: string;

  @IsInt()
  @IsOptional()
  total_interactions?: number;

  @IsInt()
  @IsOptional()
  referrals_given?: number;

  @IsInt()
  @IsOptional()
  referrals_received?: number;

  @IsInt()
  @IsOptional()
  job_opportunities_sourced?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  value_provided_score?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  value_received_score?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
