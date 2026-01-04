import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { EducationLevel } from './education-level.enum';

export class CreateEducationValidation {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  degree: string;

  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  ongoing?: boolean;

  @IsOptional()
  @IsNumber()
  gpa?: number;

  @IsOptional()
  @IsBoolean()
  showGpa?: boolean;

  @IsOptional()
  honors?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;
}
