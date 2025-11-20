import { Controller, Get, Put, Post, Body, Param, Query } from "@nestjs/common";
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

  @Get(":userId/:jobId")
  async getDetailedMatch(
    @Param("userId") userId: string,
    @Param("jobId") jobId: string
  ): Promise<any> {
    return await this.matchService.getDetailedMatch(userId, jobId);
  }

  @Get("user-skills/:userId")
  async getUserSkills(@Param("userId") userId: string): Promise<any> {
    return await this.matchService.getUserSkills(userId);
  }

  @Get("weights/:userId")
  async getUserWeights(@Param("userId") userId: string): Promise<any> {
    return await this.matchService.getUserWeights(userId);
  }

  @Put("weights/:userId")
  async updateUserWeights(
    @Param("userId") userId: string,
    @Body() weights: { skills_weight: number; experience_weight: number; education_weight: number }
  ): Promise<any> {
    return await this.matchService.updateUserWeights(userId, weights);
  }

  @Get("history/:userId")
  async getMatchHistory(@Param("userId") userId: string): Promise<any> {
    return await this.matchService.getMatchHistory(userId);
  }

  @Post("history")
  async saveMatchHistory(
    @Body() data: { userId: string; jobId: string; matchScore: number }
  ): Promise<any> {
    return await this.matchService.saveMatchHistory(data.userId, data.jobId, data.matchScore);
  }

  @Get("compare/:userId")
  async compareJobs(
    @Param("userId") userId: string,
    @Query("jobIds") jobIds: string
  ): Promise<any> {
    const jobIdArray = jobIds.split(",");
    return await this.matchService.compareMultipleJobs(userId, jobIdArray);
  }

  @Get("gaps")
  async getSkillGaps(
    @Query("userId") userId: string,
    @Query("jobId") jobId: string
  ): Promise<any> {
    if (!userId || !jobId) return { error: "Missing userId or jobId" };
    return await this.matchService.getSkillGaps(userId, jobId);
  }

  @Get("rank")
  async rankJobs(
    @Query("userId") userId: string,
    @Query("jobIds") jobIds?: string
  ): Promise<any> {
    if (!userId) return { error: "Missing userId" };
    const jobIdArray = jobIds ? jobIds.split(',').filter(id => id.trim()) : undefined;
    return await this.matchService.rankJobs(userId, jobIdArray);
  }

  @Get("improvements")
  async getProfileImprovements(
    @Query("userId") userId: string,
    @Query("jobIds") jobIds?: string
  ): Promise<any> {
    if (!userId) return { error: "Missing userId" };
    const jobIdArray = jobIds ? jobIds.split(',').filter(id => id.trim()) : undefined;
    return await this.matchService.getProfileImprovements(userId, jobIdArray);
  }

  @Get("report")
  async exportMatchReport(
    @Query("userId") userId: string,
    @Query("jobIds") jobIds?: string
  ): Promise<any> {
    if (!userId) return { error: "Missing userId" };
    const jobIdArray = jobIds ? jobIds.split(',').filter(id => id.trim()) : undefined;
    return await this.matchService.exportMatchReport(userId, jobIdArray);
  }
}