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
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateContactDto,
  UpdateContactDto,
  CreateInteractionDto,
  UpdateInteractionDto,
} from './dto/contact.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * Get all contacts with optional filters
   * GET /contacts?search=&company=&industry=&relationshipType=
   */
  @Get()
  async getAllContacts(@Req() req: any, @Query() filters: any) {
    const userId = req.user.userId;
    return this.contactsService.getAllContacts(userId, filters);
  }

  /**
   * Get contact statistics
   * GET /contacts/stats
   */
  @Get('stats')
  async getStats(@Req() req: any) {
    const userId = req.user.userId;
    return this.contactsService.getContactStats(userId);
  }

  /**
   * Get a single contact by ID
   * GET /contacts/:id
   */
  @Get(':id')
  async getContactById(@Req() req: any, @Param('id') contactId: string) {
    const userId = req.user.userId;
    return this.contactsService.getContactById(userId, contactId);
  }

  /**
   * Create a new contact
   * POST /contacts
   */
  @Post()
  async createContact(@Req() req: any, @Body() createContactDto: CreateContactDto) {
    const userId = req.user.userId;
    return this.contactsService.createContact(userId, createContactDto);
  }

  /**
   * Update a contact
   * PUT /contacts/:id
   */
  @Put(':id')
  async updateContact(
    @Req() req: any,
    @Param('id') contactId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    const userId = req.user.userId;
    return this.contactsService.updateContact(userId, contactId, updateContactDto);
  }

  /**
   * Delete a contact
   * DELETE /contacts/:id
   */
  @Delete(':id')
  async deleteContact(@Req() req: any, @Param('id') contactId: string) {
    const userId = req.user.userId;
    return this.contactsService.deleteContact(userId, contactId);
  }

  /**
   * Get all interactions for a contact
   * GET /contacts/:id/interactions
   */
  @Get(':id/interactions')
  async getContactInteractions(@Req() req: any, @Param('id') contactId: string) {
    const userId = req.user.userId;
    return this.contactsService.getContactInteractions(userId, contactId);
  }

  /**
   * Create a new interaction
   * POST /contacts/interactions
   */
  @Post('interactions')
  async createInteraction(@Req() req: any, @Body() createInteractionDto: CreateInteractionDto) {
    const userId = req.user.userId;
    return this.contactsService.createInteraction(userId, createInteractionDto);
  }

  /**
   * Update an interaction
   * PUT /contacts/interactions/:id
   */
  @Put('interactions/:id')
  async updateInteraction(
    @Req() req: any,
    @Param('id') interactionId: string,
    @Body() updateInteractionDto: UpdateInteractionDto,
  ) {
    const userId = req.user.userId;
    return this.contactsService.updateInteraction(userId, interactionId, updateInteractionDto);
  }

  /**
   * Delete an interaction
   * DELETE /contacts/interactions/:id
   */
  @Delete('interactions/:id')
  async deleteInteraction(@Req() req: any, @Param('id') interactionId: string) {
    const userId = req.user.userId;
    return this.contactsService.deleteInteraction(userId, interactionId);
  }
}
