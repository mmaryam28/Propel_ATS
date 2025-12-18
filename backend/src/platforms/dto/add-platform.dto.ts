import { IsString, IsOptional, IsUrl } from 'class-validator';

export class AddPlatformDto {
  @IsString()
  platform: string; // 'linkedin', 'indeed', 'glassdoor', 'company_site', 'other'

  @IsOptional()
  @IsString()
  platform_job_id?: string;

  @IsOptional()
  @IsUrl()
  application_url?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
