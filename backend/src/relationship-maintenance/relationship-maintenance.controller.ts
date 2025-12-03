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
import { RelationshipMaintenanceService } from './relationship-maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';

@Controller('relationship-maintenance')
@UseGuards(JwtAuthGuard)
export class RelationshipMaintenanceController {
  constructor(
    private readonly relationshipMaintenanceService: RelationshipMaintenanceService,
  ) {}

  /**
   * Get suggested industry contacts
   * GET /relationship-maintenance/suggestions
   */
  @Get('suggestions')
  async getSuggestedContacts(@Req() req: any) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getSuggestedContacts(userId);
  }

  /**
   * Get connection path to a suggested contact
   * GET /relationship-maintenance/connection-path/:contactId
   */
  @Get('connection-path/:contactId')
  async getConnectionPath(@Req() req: any, @Param('contactId') contactId: string) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getConnectionPath(userId, contactId);
  }

  /**
   * Get all reminders
   * GET /relationship-maintenance/reminders?status=pending
   */
  @Get('reminders')
  async getReminders(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getReminders(userId, status);
  }

  /**
   * Get upcoming reminders (next 7 days)
   * GET /relationship-maintenance/reminders/upcoming
   */
  @Get('reminders/upcoming')
  async getUpcomingReminders(@Req() req: any) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getUpcomingReminders(userId);
  }

  /**
   * Get overdue reminders
   * GET /relationship-maintenance/reminders/overdue
   */
  @Get('reminders/overdue')
  async getOverdueReminders(@Req() req: any) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getOverdueReminders(userId);
  }

  /**
   * Get relationship health scores
   * GET /relationship-maintenance/health-scores
   */
  @Get('health-scores')
  async getRelationshipHealthScores(@Req() req: any) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.getRelationshipHealthScores(userId);
  }

  /**
   * Create a new reminder
   * POST /relationship-maintenance/reminders
   */
  @Post('reminders')
  async createReminder(@Req() req: any, @Body() createReminderDto: CreateReminderDto) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.createReminder(userId, createReminderDto);
  }

  /**
   * Auto-generate reminders for inactive contacts
   * POST /relationship-maintenance/reminders/auto-generate
   */
  @Post('reminders/auto-generate')
  async autoGenerateReminders(@Req() req: any, @Query('days') days?: number) {
    const userId = req.user.userId;
    const daysSinceLastContact = days ? parseInt(days.toString()) : 60;
    return this.relationshipMaintenanceService.autoGenerateReminders(userId, daysSinceLastContact);
  }

  /**
   * Update a reminder
   * PUT /relationship-maintenance/reminders/:id
   */
  @Put('reminders/:id')
  async updateReminder(
    @Req() req: any,
    @Param('id') reminderId: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.updateReminder(reminderId, userId, updateReminderDto);
  }

  /**
   * Delete a reminder
   * DELETE /relationship-maintenance/reminders/:id
   */
  @Delete('reminders/:id')
  async deleteReminder(@Req() req: any, @Param('id') reminderId: string) {
    const userId = req.user.userId;
    return this.relationshipMaintenanceService.deleteReminder(reminderId, userId);
  }
}
