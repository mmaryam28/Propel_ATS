import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CompetitiveService } from './competitive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('competitive')
@UseGuards(JwtAuthGuard)
export class CompetitiveController {
  constructor(private readonly competitiveService: CompetitiveService) {}

  @Get('benchmarks')
  async getBenchmarks(@Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.competitiveService.getBenchmarks(userId);
  }

  @Get('positioning')
  async getSkillPositioning(@Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.competitiveService.getSkillPositioning(userId);
  }

  @Get('career-patterns')
  async getCareerPatterns(@Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.competitiveService.getCareerPatterns(userId);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    return this.competitiveService.getRecommendations(userId);
  }
}
