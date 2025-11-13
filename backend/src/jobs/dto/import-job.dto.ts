import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportJobDto {
  @IsString()
  @IsNotEmpty()
  url!: string;
}

export interface ImportJobResponse {
  success: boolean;
  status: 'success' | 'partial' | 'failed';
  data: {
    // Core job fields
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    postingUrl: string;
    // Enriched company profile fields (all optional)
    companySize?: string | null;
    companyWebsite?: string | null;
    companyDescription?: string | null;
    companyMission?: string | null;
    companyLogoUrl?: string | null;
    companyContactEmail?: string | null;
    companyContactPhone?: string | null;
    glassdoorRating?: number | null; // rating rarely extractable automatically
    glassdoorUrl?: string | null;    // search URL fallback
  };
  message: string;
}
