import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResumeDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  templateId?: string;

  @IsOptional()
  sections?: Record<string, any>;

  @IsOptional()
  skills?: Record<string, any>;

  @IsOptional()
  experience?: Record<string, any>;

  @IsOptional()
  aiContent?: Record<string, any>;

  @IsOptional()
  versionTag?: string;
}
