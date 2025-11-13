import { IsObject } from "class-validator";

export class ValidateResumeDto {
  @IsObject()
  userProfile: any;
}
