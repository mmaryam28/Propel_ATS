import { IsString, IsOptional, IsUUID, IsDateString, IsInt, Min } from 'class-validator';

export class CreateReferralRequestDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  contactId: string;

  @IsOptional()
  @IsString()
  requestTemplate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReferralRequestDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  requestTemplate?: string;

  @IsOptional()
  @IsDateString()
  sentDate?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  followUpCount?: number;

  @IsOptional()
  @IsDateString()
  responseDate?: string;

  @IsOptional()
  @IsString()
  responseType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateTemplateDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  contactId: string;
}
