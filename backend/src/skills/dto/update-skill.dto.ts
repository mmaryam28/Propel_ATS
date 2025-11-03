import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { SkillCategory, SkillProficiency } from '../skills.service';

export class UpdateSkillDto {
  @IsString()
  userId!: string; // required to locate bucket, but left without IsNotEmpty to allow PATCH ergonomics

  @IsString() @IsOptional()
  name?: string;

  @IsEnum(['Technical','Soft Skills','Languages','Industry-Specific'] as const) @IsOptional()
  category?: SkillCategory;

  @IsEnum(['Beginner','Intermediate','Advanced','Expert'] as const) @IsOptional()
  proficiency?: SkillProficiency;
}
