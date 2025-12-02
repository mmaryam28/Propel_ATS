import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NetworkingService } from './networking.service';
import { CreateContactDto, UpdateContactDto } from './dto/create-contact.dto';
import { CreateActivityDto, UpdateActivityDto } from './dto/create-activity.dto';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';

@Controller('networking')
@UseGuards(JwtAuthGuard)
export class NetworkingController {
  constructor(private readonly networkingService: NetworkingService) {}

  // Contact endpoints
  @Post('contacts')
  async createContact(@Request() req, @Body() createContactDto: CreateContactDto) {
    return this.networkingService.createContact(req.user.userId, createContactDto);
  }

  @Get('contacts')
  async getContacts(
    @Request() req,
    @Query('relationship_strength') relationshipStrength?: string,
    @Query('industry') industry?: string,
    @Query('connection_source') connectionSource?: string,
  ) {
    const filters: any = {};
    if (relationshipStrength) filters.relationship_strength = parseInt(relationshipStrength);
    if (industry) filters.industry = industry;
    if (connectionSource) filters.connection_source = connectionSource;

    return this.networkingService.getContacts(req.user.userId, filters);
  }

  @Put('contacts/:id')
  async updateContact(@Request() req, @Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.networkingService.updateContact(req.user.userId, id, updateContactDto);
  }

  @Delete('contacts/:id')
  async deleteContact(@Request() req, @Param('id') id: string) {
    return this.networkingService.deleteContact(req.user.userId, id);
  }

  // Activity endpoints
  @Post('activities')
  async createActivity(@Request() req, @Body() createActivityDto: CreateActivityDto) {
    return this.networkingService.createActivity(req.user.userId, createActivityDto);
  }

  @Get('activities')
  async getActivities(
    @Request() req,
    @Query('contact_id') contactId?: string,
    @Query('activity_type') activityType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: any = {};
    if (contactId) filters.contact_id = contactId;
    if (activityType) filters.activity_type = activityType;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    return this.networkingService.getActivities(req.user.userId, filters);
  }

  // Event endpoints
  @Post('events')
  async createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.networkingService.createEvent(req.user.userId, createEventDto);
  }

  @Get('events')
  async getEvents(
    @Request() req,
    @Query('event_type') eventType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: any = {};
    if (eventType) filters.event_type = eventType;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    return this.networkingService.getEvents(req.user.userId, filters);
  }

  // Analytics endpoints
  @Get('analytics/overview')
  async getDashboard(@Request() req, @Query('industry') industry?: string) {
    return this.networkingService.getDashboard(req.user.userId, industry);
  }

  @Get('analytics/volume')
  async getActivityVolume(@Request() req, @Query('timeframe') timeframe?: string) {
    return this.networkingService.getActivityVolume(req.user.userId, timeframe);
  }

  @Get('analytics/referrals')
  async getReferralMetrics(@Request() req) {
    return this.networkingService.getReferralMetrics(req.user.userId);
  }

  @Get('analytics/relationships')
  async getRelationshipAnalysis(@Request() req) {
    return this.networkingService.getRelationshipAnalysis(req.user.userId);
  }

  @Get('analytics/roi')
  async getEventROI(@Request() req) {
    return this.networkingService.getEventROI(req.user.userId);
  }

  @Get('analytics/value-exchange')
  async getValueExchange(@Request() req) {
    return this.networkingService.getValueExchangeMetrics(req.user.userId);
  }

  @Get('analytics/insights')
  async getInsights(@Request() req) {
    return this.networkingService.getNetworkingInsights(req.user.userId);
  }

  @Get('analytics/benchmarks')
  async getBenchmarks(@Request() req, @Query('industry') industry?: string) {
    return this.networkingService.getIndustryBenchmarks(req.user.userId, industry);
  }
}
