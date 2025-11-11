import { IsInt, IsOptional, IsString, Min, IsEmail } from 'class-validator';

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
}
