import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class GenerateAIDto {

  templateType: 'chronological' | 'functional' | 'hybrid';

  @IsNotEmpty()
  @IsString()
  jobDescription: string;

  @IsNotEmpty()
  @IsObject()
  userProfile: Record<string, any>;
}
