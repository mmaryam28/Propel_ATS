import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import type { SkillCategory, SkillProficiency } from '../skills.service';

export class CreateSkillDto {
  @IsString() @IsNotEmpty()
  userId!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsEnum(['Technical','Soft Skills','Languages','Industry-Specific'] as const)
  category!: SkillCategory;

  @IsEnum(['Beginner','Intermediate','Advanced','Expert'] as const)
  proficiency!: SkillProficiency;
}
