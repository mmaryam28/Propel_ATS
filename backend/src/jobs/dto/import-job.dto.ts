import { IsNotEmpty, IsString } from 'class-validator';

export class ImportJobDto {
  @IsString()
  @IsNotEmpty()
  url!: string;
}

export interface ImportJobResponse {
  success: boolean;
  status: 'success' | 'partial' | 'failed';
  data: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    postingUrl: string;
  };
  message: string;
}
