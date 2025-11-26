import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // Create a new SMART goal
  @Post()
  async createGoal(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.createGoal(req.user.userId, createGoalDto);
  }

  // Get all goals with optional filters
  @Get()
  async getGoals(
    @Request() req,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('timeframe') timeframe?: 'short_term' | 'long_term' | 'all',
  ) {
    return this.goalsService.getGoals(req.user.userId, {
      category,
      status,
      priority,
      timeframe: timeframe || 'all',
    });
  }

  // Get achievement analytics
  @Get('analytics/achievement')
  async getAchievementAnalytics(@Request() req) {
    return this.goalsService.getAchievementAnalytics(req.user.userId);
  }

  // Get goal impact on job search
  @Get('analytics/impact')
  async getGoalImpact(@Request() req) {
    return this.goalsService.getGoalImpact(req.user.userId);
  }

  // Get goal-setting insights
  @Get('analytics/insights')
  async getGoalSettingInsights(@Request() req) {
    return this.goalsService.getGoalSettingInsights(req.user.userId);
  }

  // Get shared goals (goals shared with current user)
  @Get('shared')
  async getSharedGoals(@Request() req) {
    return this.goalsService.getSharedGoals(req.user.email);
  }

  // Get specific goal by ID with progress history
  @Get(':id')
  async getGoalById(@Request() req, @Param('id') id: string) {
    return this.goalsService.getGoalById(req.user.userId, id);
  }

  // Get recommendations for a specific goal
  @Get(':id/recommendations')
  async getRecommendations(@Request() req, @Param('id') id: string) {
    return this.goalsService.getRecommendations(req.user.userId, id);
  }

  // Update a goal
  @Put(':id')
  async updateGoal(
    @Request() req,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(req.user.userId, id, updateGoalDto);
  }

  // Share goal with accountability partners
  @Post(':id/share')
  async shareGoal(
    @Request() req,
    @Param('id') id: string,
    @Body('emails') emails: string[],
  ) {
    return this.goalsService.shareGoal(req.user.userId, id, emails);
  }

  // Add milestone to goal
  @Post(':id/milestones')
  async addMilestone(
    @Request() req,
    @Param('id') id: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
  ) {
    return this.goalsService.addMilestone(req.user.userId, id, createMilestoneDto);
  }

  // Complete a milestone
  @Put(':goalId/milestones/:milestoneId/complete')
  async completeMilestone(
    @Request() req,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.goalsService.completeMilestone(req.user.userId, goalId, milestoneId);
  }

  // Delete a goal
  @Delete(':id')
  async deleteGoal(@Request() req, @Param('id') id: string) {
    return this.goalsService.deleteGoal(req.user.userId, id);
  }
}
