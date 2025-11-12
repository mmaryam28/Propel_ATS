import { IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class UpdateJobDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() postingUrl?: string | null;
  @IsOptional() @IsString() deadline?: string | null;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() industry?: string | null;
  @IsOptional() @IsString() jobType?: string | null;
  @IsOptional() @IsInt() @Min(0) salaryMin?: number | null;
  @IsOptional() @IsInt() @Min(0) salaryMax?: number | null;

  // Notes and contacts
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() negotiationNotes?: string | null;
  @IsOptional() @IsString() interviewNotes?: string | null;

  @IsOptional() @IsString() recruiterName?: string | null;
  @IsOptional() @IsEmail() recruiterEmail?: string | null;
  @IsOptional() @IsString() recruiterPhone?: string | null;

  @IsOptional() @IsString() hiringManagerName?: string | null;
  @IsOptional() @IsEmail() hiringManagerEmail?: string | null;
  @IsOptional() @IsString() hiringManagerPhone?: string | null;

  // Company profile fields (UC-043)
  @IsOptional() @IsString() companySize?: string | null; // e.g., "51-200", "1000+"
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'companyWebsite must be a valid URL' }) companyWebsite?: string | null;
  @IsOptional() @IsString() companyDescription?: string | null;
  @IsOptional() @IsString() companyMission?: string | null;
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'companyLogoUrl must be a valid URL' }) companyLogoUrl?: string | null;
  @IsOptional() @IsEmail() companyContactEmail?: string | null;
  @IsOptional() @IsString() companyContactPhone?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(5) glassdoorRating?: number | null;
  @IsOptional() @IsUrl({ require_tld: false }, { message: 'glassdoorUrl must be a valid URL' }) glassdoorUrl?: string | null;
}
