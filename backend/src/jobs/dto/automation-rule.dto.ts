import { IsString, IsObject, IsBoolean, IsOptional } from 'class-validator';

export class CreateAutomationRuleDto {
  @IsString()
  ruleName: string;

  @IsString()
  triggerEvent: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  actionParams?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  ruleName?: string;

  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsObject()
  actionParams?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
