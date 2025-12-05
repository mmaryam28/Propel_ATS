import { IsString, IsOptional, IsDateString, IsUUID, IsBoolean } from 'class-validator';

export class CreateNetworkingEventDto {
  @IsString()
  eventName: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateNetworkingEventDto {
  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateEventConnectionDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  contactId: string;

  @IsOptional()
  @IsBoolean()
  followUpNeeded?: boolean;

  @IsOptional()
  @IsDateString()
  followUpDue?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEventConnectionDto {
  @IsOptional()
  @IsBoolean()
  followUpNeeded?: boolean;

  @IsOptional()
  @IsDateString()
  followUpDue?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
