import { IsEnum, IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';
import type { SkillCategory } from '../skills.service';

export class ReorderDto {
  @IsString() @IsNotEmpty()
  userId!: string;

  @IsEnum(['Technical','Soft Skills','Languages','Industry-Specific'] as const)
  category!: SkillCategory;

  @IsArray() @ArrayMinSize(1)
  orderedIds!: string[];
}
