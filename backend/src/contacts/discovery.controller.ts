import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrackSuggestionDto } from './dto/discovery.dto';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Get suggested contacts for the user
   * GET /discovery/suggestions
   */
  @Get('suggestions')
  async getSuggestions(@Req() req: any) {
    const userId = req.user.userId;
    return this.discoveryService.getSuggestions(userId);
  }

  /**
   * Get connection path for a suggested contact
   * GET /discovery/path/:contactId
   */
  @Get('path/:contactId')
  async getConnectionPath(@Req() req: any, @Param('contactId') contactId: string) {
    const userId = req.user.userId;
    return this.discoveryService.getConnectionPath(userId, contactId);
  }

  /**
   * Track user action on a suggestion
   * POST /discovery/track
   */
  @Post('track')
  async trackAction(@Req() req: any, @Body() trackDto: TrackSuggestionDto) {
    const userId = req.user.userId;
    await this.discoveryService.trackAction(
      userId,
      trackDto.suggestedContactId,
      trackDto.action,
      trackDto.notes,
    );
    return { message: 'Action tracked successfully' };
  }
}
