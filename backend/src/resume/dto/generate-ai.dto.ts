import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class GenerateAIDto {
  @IsNotEmpty()
  @IsString()
  jobDescription: string;

  @IsNotEmpty()
  @IsObject()
  userProfile: Record<string, any>;
}
