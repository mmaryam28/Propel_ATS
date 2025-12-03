import { IsString, IsOptional, IsIn } from 'class-validator';

export class TrackSuggestionDto {
  @IsString()
  suggestedContactId: string;

  @IsString()
  @IsIn(['viewed', 'accepted', 'ignored', 'contacted'])
  action: 'viewed' | 'accepted' | 'ignored' | 'contacted';

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface SuggestedContact {
  id: string;
  full_name: string;
  headline?: string;
  company?: string;
  role?: string;
  industry?: string;
  linkedin_profile_url?: string;
  email?: string;
  phone?: string;
  score: number;
  mutualConnectionsCount: number;
  connectionPath: string[];
  scoringDetails: {
    sameIndustry: boolean;
    hasMutualConnections: boolean;
    inTargetCompany: boolean;
  };
}

export interface ConnectionPath {
  suggestedContact: any;
  path: Array<{
    id: string;
    full_name: string;
    company?: string;
    role?: string;
  }>;
  mutualConnections: Array<{
    id: string;
    full_name: string;
    company?: string;
    role?: string;
  }>;
}
