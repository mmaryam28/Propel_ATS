import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class EnrichCompanyDto {
  @IsString()
  @IsNotEmpty()
  url!: string;
}

export type EnrichCompanyResponse = {
  success: boolean;
  message: string;
  data: {
    // Optional inferred company name
    company?: string | null;
    // Company profile fields mapped to UpdateJobDto keys
    companyWebsite?: string | null;
    companyDescription?: string | null;
    companyMission?: string | null;
    companyLogoUrl?: string | null;
    companyContactEmail?: string | null;
    companyContactPhone?: string | null;
    companySize?: string | null;
    glassdoorUrl?: string | null;
  };
};
