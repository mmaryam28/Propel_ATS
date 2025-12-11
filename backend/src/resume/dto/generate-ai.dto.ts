import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class GenerateAIDto {

  templateType: 'chronological' | 'functional' | 'hybrid';

  // Replaces manual job description text
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsNotEmpty()
  @IsObject()
  userProfile: Record<string, any>;
}
