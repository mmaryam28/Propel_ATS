import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NetworkingEventsService } from './networking-events.service';
import {
  CreateNetworkingEventDto,
  UpdateNetworkingEventDto,
  CreateEventConnectionDto,
  UpdateEventConnectionDto,
} from './dto/networking-event.dto';

@Controller('networking-events')
@UseGuards(JwtAuthGuard)
export class NetworkingEventsController {
  constructor(
    private readonly networkingEventsService: NetworkingEventsService,
  ) {}

  @Get()
  async getAllEvents(@Request() req) {
    return this.networkingEventsService.getAllEvents(req.user.userId);
  }

  @Get('stats')
  async getEventStats(@Request() req) {
    return this.networkingEventsService.getEventStats(req.user.userId);
  }

  @Get('follow-ups')
  async getConnectionsNeedingFollowUp(@Request() req) {
    return this.networkingEventsService.getConnectionsNeedingFollowUp(
      req.user.userId,
    );
  }

  @Get(':id')
  async getEventById(@Param('id') id: string, @Request() req) {
    return this.networkingEventsService.getEventById(id, req.user.userId);
  }

  @Post()
  async createEvent(
    @Body() createEventDto: CreateNetworkingEventDto,
    @Request() req,
  ) {
    return this.networkingEventsService.createEvent(
      req.user.userId,
      createEventDto,
    );
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateNetworkingEventDto,
    @Request() req,
  ) {
    return this.networkingEventsService.updateEvent(
      id,
      req.user.userId,
      updateEventDto,
    );
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string, @Request() req) {
    return this.networkingEventsService.deleteEvent(id, req.user.userId);
  }

  // Event Connections
  @Post('connections')
  async createEventConnection(
    @Body() createConnectionDto: CreateEventConnectionDto,
    @Request() req,
  ) {
    return this.networkingEventsService.createEventConnection(
      req.user.userId,
      createConnectionDto,
    );
  }

  @Put('connections/:id')
  async updateEventConnection(
    @Param('id') id: string,
    @Body() updateConnectionDto: UpdateEventConnectionDto,
    @Request() req,
  ) {
    return this.networkingEventsService.updateEventConnection(
      id,
      req.user.userId,
      updateConnectionDto,
    );
  }

  @Delete('connections/:id')
  async deleteEventConnection(@Param('id') id: string, @Request() req) {
    return this.networkingEventsService.deleteEventConnection(
      id,
      req.user.userId,
    );
  }
}
