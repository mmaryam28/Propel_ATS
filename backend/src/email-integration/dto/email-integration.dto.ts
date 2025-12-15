import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectGmailDto {
  @IsString()
  code: string; // OAuth authorization code from Google
}

export class SearchEmailsDto {
  @IsOptional()
  @IsString()
  query?: string; // Search query (company name, job title, etc.)
  
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxResults?: number; // Default 20
  
  @IsOptional()
  @IsString()
  pageToken?: string; // For pagination
}

export class LinkEmailDto {
  @IsString()
  jobId: string;
  
  @IsString()
  emailId: string; // Gmail message ID
}

export class EmailMetadata {
  id: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  receivedDate: string;
  snippet: string;
  isRead: boolean;
  labels?: string[];
}

export class LinkedEmailResponse extends EmailMetadata {
  linkedAt: string;
}
