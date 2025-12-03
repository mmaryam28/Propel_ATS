import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateContactDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  relationshipType?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  linkedinProfileUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  relationshipType?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  linkedinProfileUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateInteractionDto {
  @IsString()
  contactId: string;

  @IsString()
  interactionType: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  date?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  relationshipStrength?: number;
}

export class UpdateInteractionDto {
  @IsOptional()
  @IsString()
  interactionType?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  date?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  relationshipStrength?: number;
}
