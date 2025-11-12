import { IsEmail, IsInt, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, Max } from 'class-validator';

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

  // Company profile fields (UC-043) — optional at job creation
  @IsOptional() @IsString() companySize?: string | null;
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'companyWebsite must be a valid URL' }) companyWebsite?: string | null;
  @IsOptional() @IsString() companyDescription?: string | null;
  @IsOptional() @IsString() companyMission?: string | null;
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'companyLogoUrl must be a valid URL' }) companyLogoUrl?: string | null;
  @IsOptional() @IsEmail() companyContactEmail?: string | null;
  @IsOptional() @IsString() companyContactPhone?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(5) glassdoorRating?: number | null;
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'glassdoorUrl must be a valid URL' }) glassdoorUrl?: string | null;
}
