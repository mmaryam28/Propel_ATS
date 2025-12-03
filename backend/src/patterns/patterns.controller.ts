import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PatternsService } from './patterns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('patterns')
@UseGuards(JwtAuthGuard)
export class PatternsController {
  constructor(private readonly patternsService: PatternsService) {}

  @Get('application-success')
  async getApplicationSuccessPatterns(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getApplicationSuccessPatterns(userId);
  }

  @Get('preparation-correlation')
  async getPreparationCorrelation(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getPreparationCorrelation(userId);
  }

  @Get('timing')
  async getTimingPatterns(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getTimingPatterns(userId);
  }

  @Get('strategy-effectiveness')
  async getStrategyEffectiveness(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getStrategyEffectiveness(userId);
  }

  @Get('success-factors')
  async getPersonalSuccessFactors(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getPersonalSuccessFactors(userId);
  }

  @Get('predictive-model')
  async getPredictiveModel(@Req() req: any, @Query('opportunityId') opportunityId?: string) {
    const userId = req.user.userId;
    return this.patternsService.getPredictiveModel(userId, opportunityId);
  }

  @Get('recommendations')
  async getRecommendations(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getRecommendations(userId);
  }

  @Get('evolution')
  async getPatternEvolution(@Req() req: any, @Query('timeframe') timeframe?: string) {
    const userId = req.user.userId;
    return this.patternsService.getPatternEvolution(userId, timeframe || '1year');
  }

  @Get('dashboard')
  async getPatternsDashboard(@Req() req: any) {
    const userId = req.user.userId;
    return this.patternsService.getPatternsDashboard(userId);
  }
}
