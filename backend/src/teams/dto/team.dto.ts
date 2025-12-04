import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['free', 'basic', 'premium', 'enterprise'])
  subscriptionType?: 'free' | 'basic' | 'premium' | 'enterprise';

  @IsOptional()
  @IsEmail()
  billingEmail?: string;
}

export class UpdateTeamDto {
  name?: string;
  description?: string;
  subscriptionType?: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'cancelled';
  billingEmail?: string;
  maxMembers?: number;
}

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['admin', 'mentor', 'candidate'])
  role: 'admin' | 'mentor' | 'candidate';
}

export class UpdateMemberDto {
  @IsOptional()
  @IsEnum(['admin', 'mentor', 'candidate'])
  role?: 'admin' | 'mentor' | 'candidate';

  @IsOptional()
  permissions?: {
    view_all_candidates?: boolean;
    edit_candidates?: boolean;
    view_analytics?: boolean;
    manage_team?: boolean;
    invite_members?: boolean;
  };

  @IsOptional()
  @IsEnum(['active', 'inactive', 'removed'])
  status?: 'active' | 'inactive' | 'removed';
}

export class AcceptInvitationDto {
  @IsString()
  token: string;
}
