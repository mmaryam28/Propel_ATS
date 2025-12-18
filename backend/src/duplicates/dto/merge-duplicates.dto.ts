import { IsString, IsArray, IsUUID } from 'class-validator';

export class MergeDuplicatesDto {
  @IsUUID()
  @IsString()
  masterJobId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  duplicateJobIds: string[];
}
