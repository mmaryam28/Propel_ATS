import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateReferralRequestDto,
  UpdateReferralRequestDto,
  GenerateTemplateDto,
} from './dto/referral.dto';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * Get all referral requests with optional filters
   * GET /referrals?status=&jobId=
   */
  @Get()
  async getAllReferrals(@Req() req: any, @Query() filters: any) {
    const userId = req.user.userId;
    return this.referralsService.getAllReferrals(userId, filters);
  }

  /**
   * Get referral statistics
   * GET /referrals/stats
   */
  @Get('stats')
  async getStats(@Req() req: any) {
    const userId = req.user.userId;
    return this.referralsService.getReferralStats(userId);
  }

  /**
   * Get referrals needing follow-up
   * GET /referrals/follow-up
   */
  @Get('follow-up')
  async getFollowUps(@Req() req: any) {
    const userId = req.user.userId;
    return this.referralsService.getReferralsNeedingFollowUp(userId);
  }

  /**
   * Generate referral request template
   * POST /referrals/generate-template
   */
  @Post('generate-template')
  async generateTemplate(@Req() req: any, @Body() dto: GenerateTemplateDto) {
    const userId = req.user.userId;
    return this.referralsService.generateTemplate(userId, dto);
  }

  /**
   * Get a single referral request by ID
   * GET /referrals/:id
   */
  @Get(':id')
  async getReferralById(@Req() req: any, @Param('id') referralId: string) {
    const userId = req.user.userId;
    return this.referralsService.getReferralById(userId, referralId);
  }

  /**
   * Get referral request history
   * GET /referrals/:id/history
   */
  @Get(':id/history')
  async getReferralHistory(@Req() req: any, @Param('id') referralId: string) {
    const userId = req.user.userId;
    return this.referralsService.getReferralHistory(userId, referralId);
  }

  /**
   * Create a new referral request
   * POST /referrals
   */
  @Post()
  async createReferral(@Req() req: any, @Body() dto: CreateReferralRequestDto) {
    const userId = req.user.userId;
    return this.referralsService.createReferral(userId, dto);
  }

  /**
   * Update a referral request
   * PUT /referrals/:id
   */
  @Put(':id')
  async updateReferral(
    @Req() req: any,
    @Param('id') referralId: string,
    @Body() dto: UpdateReferralRequestDto,
  ) {
    const userId = req.user.userId;
    return this.referralsService.updateReferral(userId, referralId, dto);
  }

  /**
   * Delete a referral request
   * DELETE /referrals/:id
   */
  @Delete(':id')
  async deleteReferral(@Req() req: any, @Param('id') referralId: string) {
    const userId = req.user.userId;
    return this.referralsService.deleteReferral(userId, referralId);
  }
}
