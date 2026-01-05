import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { SkillCategory } from '../skills.service';

export class UpdateSkillDto {
  @IsString()
  userId!: string;

  @IsString() @IsOptional()
  name?: string;

  @IsEnum(['Technical','Soft Skills'] as const) @IsOptional()
  category?: SkillCategory;
}
