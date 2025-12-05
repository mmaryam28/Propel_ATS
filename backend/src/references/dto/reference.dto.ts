import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateReferenceDto {
  @IsUUID()
  contactId: string;

  @IsOptional()
  @IsString()
  @IsIn(['professional', 'academic', 'character', 'manager', 'colleague', 'mentor'])
  referenceType?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReferenceDto {
  @IsOptional()
  @IsString()
  @IsIn(['professional', 'academic', 'character', 'manager', 'colleague', 'mentor'])
  referenceType?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReferenceRequestDto {
  @IsUUID()
  referenceId: string;

  @IsOptional()
  @IsString()
  jobId?: string; // UUID from jobs table

  @IsOptional()
  @IsString()
  talkingPoints?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class UpdateReferenceRequestDto {
  @IsOptional()
  @IsString()
  @IsIn(['requested', 'accepted', 'declined', 'completed'])
  status?: string;

  @IsOptional()
  @IsString()
  talkingPoints?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
