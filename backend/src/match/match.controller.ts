import { Controller, Get, Query } from "@nestjs/common";
import { MatchService } from "./match.service";

@Controller("match")
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  async getMatch(
    @Query("userId") userId: string,
    @Query("jobId") jobId: string
  ): Promise<any> {
    if (!userId || !jobId) {
      return { error: "Missing userId or jobId" };
    }
    return await this.matchService.computeMatch(userId, jobId);
  }

  @Get("gaps")
async getSkillGaps(
  @Query("userId") userId: string,
  @Query("jobId") jobId: string
): Promise<any> {
  if (!userId || !jobId) return { error: "Missing userId or jobId" };
  return await this.matchService.getSkillGaps(userId, jobId);
}
}