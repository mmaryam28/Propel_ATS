import { IsString, IsOptional, IsDateString, IsUUID, IsIn } from 'class-validator';

export class CreateInformationalInterviewDto {
  @IsUUID()
  contactId: string;

  @IsOptional()
  @IsString()
  @IsIn(['requested', 'scheduled', 'completed', 'declined'])
  requestStatus?: string;

  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  prepNotes?: string;

  @IsOptional()
  @IsString()
  outcomeNotes?: string;
}

export class UpdateInformationalInterviewDto {
  @IsOptional()
  @IsString()
  @IsIn(['requested', 'scheduled', 'completed', 'declined'])
  requestStatus?: string;

  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  prepNotes?: string;

  @IsOptional()
  @IsString()
  outcomeNotes?: string;
}

export class GenerateOutreachDto {
  @IsUUID()
  contactId: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  topics?: string;
}
