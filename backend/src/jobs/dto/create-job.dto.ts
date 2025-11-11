import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsIn } from 'class-validator';

export const JOB_STATUSES = [
  'Interested',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
] as const;
export type JobStatus = typeof JOB_STATUSES[number];

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

  @IsOptional()
  @IsString()
  @IsIn(JOB_STATUSES as any)
  status?: JobStatus;
}
