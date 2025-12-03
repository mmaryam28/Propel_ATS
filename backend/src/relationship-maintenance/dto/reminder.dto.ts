import { IsUUID, IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  contactId: string;

  @IsDateString()
  reminderDate: string;

  @IsString()
  @IsIn(['follow_up', 'check_in', 'birthday', 'anniversary', 'reconnect', 'custom'])
  reminderType: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReminderDto {
  @IsDateString()
  @IsOptional()
  reminderDate?: string;

  @IsString()
  @IsOptional()
  reminderType?: string;

  @IsString()
  @IsIn(['pending', 'completed', 'snoozed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
