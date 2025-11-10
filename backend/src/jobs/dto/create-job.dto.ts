import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  postingUrl?: string | null;

  @IsOptional()
  @IsString()
  deadline?: string | null; // YYYY-MM-DD or ISO

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  industry?: string | null;

  @IsOptional()
  @IsString()
  jobType?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number | null;
}
