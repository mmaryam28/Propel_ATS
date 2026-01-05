import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import type { SkillCategory } from '../skills.service';

export class CreateSkillDto {
  @IsString() @IsNotEmpty()
  userId!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsEnum(['Technical','Soft Skills'] as const)
  category!: SkillCategory;
}
