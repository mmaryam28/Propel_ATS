import { IsString, IsOptional, IsInt, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class CreateEventDto {
  @IsString()
  event_name: string;

  @IsString()
  @IsOptional()
  event_type?: string; // conference, meetup, workshop, webinar, career_fair

  @IsDateString()
  event_date: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  time_invested_hours?: number;

  @IsInt()
  @IsOptional()
  contacts_made?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  quality_rating?: number;

  @IsInt()
  @IsOptional()
  leads_generated?: number;

  @IsInt()
  @IsOptional()
  opportunities_created?: number;

  @IsNumber()
  @IsOptional()
  roi_score?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  event_name?: string;

  @IsString()
  @IsOptional()
  event_type?: string;

  @IsDateString()
  @IsOptional()
  event_date?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  time_invested_hours?: number;

  @IsInt()
  @IsOptional()
  contacts_made?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  quality_rating?: number;

  @IsInt()
  @IsOptional()
  leads_generated?: number;

  @IsInt()
  @IsOptional()
  opportunities_created?: number;

  @IsNumber()
  @IsOptional()
  roi_score?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
