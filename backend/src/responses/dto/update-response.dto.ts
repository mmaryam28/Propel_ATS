import { IsString, IsBoolean, IsOptional, IsArray, IsIn } from 'class-validator';

export class UpdateResponseDto {
  @IsOptional()
  @IsString()
  question_text?: string;

  @IsOptional()
  @IsString()
  @IsIn(['behavioral', 'technical', 'situational'])
  question_type?: 'behavioral' | 'technical' | 'situational';

  @IsOptional()
  @IsString()
  question_category?: string;

  @IsOptional()
  @IsString()
  current_response?: string;

  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;

  @IsOptional()
  @IsArray()
  tags?: Array<{ tag_type: string; tag_value: string }>;

  @IsOptional()
  @IsString()
  notes?: string;
}
