import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @UseGuards(JwtAuthGuard)
  @Get('intelligence')
  async getMarketIntelligence(@Request() req) {
    const userId = req.user.userId;
    return this.marketService.getMarketIntelligence(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('industry-trends')
  async getIndustryTrends(@Request() req) {
    return this.marketService.getIndustryTrends();
  }

  @UseGuards(JwtAuthGuard)
  @Get('skill-demand')
  async getSkillDemand() {
    return this.marketService.getSkillDemand();
  }

  @UseGuards(JwtAuthGuard)
  @Get('salary-trends')
  async getSalaryTrends() {
    return this.marketService.getSalaryTrends();
  }

  @UseGuards(JwtAuthGuard)
  @Get('company-growth')
  async getCompanyGrowth() {
    return this.marketService.getCompanyGrowth();
  }

  @UseGuards(JwtAuthGuard)
  @Get('insights')
  async getIndustryInsights() {
    return this.marketService.getIndustryInsights();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  async getSkillRecommendations(@Request() req) {
    const userId = req.user.userId;
    return this.marketService.getSkillRecommendations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('timing')
  async getMarketTiming() {
    return this.marketService.getMarketTiming();
  }

  @UseGuards(JwtAuthGuard)
  @Get('competitive-landscape')
  async getCompetitiveLandscape(@Request() req) {
    const userId = req.user.userId;
    return this.marketService.getCompetitiveLandscape(userId);
  }
}
