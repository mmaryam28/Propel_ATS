import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class PracticeSessionDto {
  @IsString()
  @IsNotEmpty()
  practice_text: string;

  @IsNumber()
  @IsOptional()
  delivery_time?: number;
}
