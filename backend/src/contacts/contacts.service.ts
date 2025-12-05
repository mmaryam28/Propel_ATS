import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateContactDto, UpdateContactDto, CreateInteractionDto, UpdateInteractionDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all contacts for a user
   */
  async getAllContacts(userId: string, filters?: any) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('professional_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.company) {
      query = query.ilike('company', `%${filters.company}%`);
    }
    if (filters?.industry) {
      query = query.ilike('industry', `%${filters.industry}%`);
    }
    if (filters?.relationshipType) {
      query = query.eq('relationship_type', filters.relationshipType);
    }
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,role.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Get a single contact by ID
   */
  async getContactById(userId: string, contactId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('professional_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Create a new contact
   */
  async createContact(userId: string, createContactDto: CreateContactDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('professional_contacts')
      .insert({
        user_id: userId,
        full_name: createContactDto.fullName,
        headline: createContactDto.headline,
        company: createContactDto.company,
        role: createContactDto.role,
        industry: createContactDto.industry,
        relationship_type: createContactDto.relationshipType,
        source: createContactDto.source || 'manual',
        linkedin_profile_url: createContactDto.linkedinProfileUrl,
        email: createContactDto.email,
        phone: createContactDto.phone,
      })
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // After creating the contact, try to link it to a real user and populate connections
    await this.resolveContactIdentityAndConnections(userId, data.id, createContactDto);

    return data;
  }

  /**
   * Resolve if this contact is actually a user in the system and populate connections
   */
  private async resolveContactIdentityAndConnections(
    userId: string,
    contactId: string,
    contactDto: CreateContactDto | UpdateContactDto
  ) {
    const supabase = this.supabaseService.getClient();

    try {
      // Try to find a matching user by email or LinkedIn URL
      let matchedUserId: string | null = null;

      // Match by email first (most reliable)
      if (contactDto.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', contactDto.email)
          .single();

        if (userByEmail) {
          matchedUserId = userByEmail.id;
        }
      }

      // Match by LinkedIn URL if email didn't work
      if (!matchedUserId && contactDto.linkedinProfileUrl) {
        const normalizedLinkedIn = this.normalizeLinkedInUrl(contactDto.linkedinProfileUrl);
        
        // Find any professional_contact that belongs to a user (user_id matches their own user record)
        // and has the same LinkedIn URL
        const { data: matchingContacts } = await supabase
          .from('professional_contacts')
          .select('user_id, id')
          .eq('source', 'self')
          .ilike('linkedin_profile_url', `%${normalizedLinkedIn}%`)
          .limit(1);

        if (matchingContacts && matchingContacts.length > 0) {
          matchedUserId = matchingContacts[0].user_id;
        }
      }

      // If we found a matching user, link to their network
      if (matchedUserId && matchedUserId !== userId) {
        await this.linkToUserNetwork(userId, contactId, matchedUserId);
      }
    } catch (error) {
      // Don't throw - identity resolution is best-effort
      console.error('Error resolving contact identity:', error);
    }
  }

  /**
   * Link a contact to a user's network by populating contact_connections
   */
  private async linkToUserNetwork(userId: string, contactId: string, targetUserId: string) {
    const supabase = this.supabaseService.getClient();

    try {
      // Get all contacts that belong to the target user
      const { data: targetUserContacts } = await supabase
        .from('professional_contacts')
        .select('id')
        .eq('user_id', targetUserId);

      if (!targetUserContacts || targetUserContacts.length === 0) {
        return; // Target user has no contacts to link
      }

      // Create connections: This contact (in my network) is connected to all of target user's contacts
      const connections = targetUserContacts.map(targetContact => ({
        contact_id: contactId,
        connected_contact_id: targetContact.id,
        connection_strength: 4, // Default medium-high strength
      }));

      // Batch insert connections
      const { error } = await supabase
        .from('contact_connections')
        .insert(connections);

      if (error) {
        console.error('Error creating contact connections:', error);
      } else {
        console.log(`✅ Linked contact ${contactId} to ${connections.length} contacts from user ${targetUserId}'s network`);
      }
    } catch (error) {
      console.error('Error linking to user network:', error);
    }
  }

  /**
   * Normalize LinkedIn URL for matching
   */
  private normalizeLinkedInUrl(url: string): string {
    if (!url) return '';
    
    // Extract the username from various LinkedIn URL formats
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/i);
    return match ? match[1].toLowerCase() : url.toLowerCase();
  }

  /**
   * Update a contact
   */
  async updateContact(userId: string, contactId: string, updateContactDto: UpdateContactDto) {
    const supabase = this.supabaseService.getClient();

    // First verify the contact belongs to the user
    await this.getContactById(userId, contactId);

    const updateData: any = {};
    if (updateContactDto.fullName !== undefined) updateData.full_name = updateContactDto.fullName;
    if (updateContactDto.headline !== undefined) updateData.headline = updateContactDto.headline;
    if (updateContactDto.company !== undefined) updateData.company = updateContactDto.company;
    if (updateContactDto.role !== undefined) updateData.role = updateContactDto.role;
    if (updateContactDto.industry !== undefined) updateData.industry = updateContactDto.industry;
    if (updateContactDto.relationshipType !== undefined) updateData.relationship_type = updateContactDto.relationshipType;
    if (updateContactDto.source !== undefined) updateData.source = updateContactDto.source;
    if (updateContactDto.linkedinProfileUrl !== undefined) updateData.linkedin_profile_url = updateContactDto.linkedinProfileUrl;
    if (updateContactDto.email !== undefined) updateData.email = updateContactDto.email;
    if (updateContactDto.phone !== undefined) updateData.phone = updateContactDto.phone;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('professional_contacts')
      .update(updateData)
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // If email or LinkedIn URL was updated, try to resolve identity again
    if (updateContactDto.email || updateContactDto.linkedinProfileUrl) {
      await this.resolveContactIdentityAndConnections(userId, contactId, updateContactDto);
    }

    return data;
  }

  /**
   * Delete a contact
   */
  async deleteContact(userId: string, contactId: string) {
    const supabase = this.supabaseService.getClient();

    // First verify the contact belongs to the user
    await this.getContactById(userId, contactId);

    const { error } = await supabase
      .from('professional_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Contact deleted successfully' };
  }

  /**
   * Get all interactions for a contact
   */
  async getContactInteractions(userId: string, contactId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify contact belongs to user
    await this.getContactById(userId, contactId);

    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Create a new interaction
   */
  async createInteraction(userId: string, createInteractionDto: CreateInteractionDto) {
    const supabase = this.supabaseService.getClient();

    // Verify contact belongs to user
    await this.getContactById(userId, createInteractionDto.contactId);

    const { data, error } = await supabase
      .from('contact_interactions')
      .insert({
        contact_id: createInteractionDto.contactId,
        user_id: userId,
        interaction_type: createInteractionDto.interactionType,
        summary: createInteractionDto.summary,
        date: createInteractionDto.date || new Date().toISOString(),
        relationship_strength: createInteractionDto.relationshipStrength,
      })
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Update an interaction
   */
  async updateInteraction(userId: string, interactionId: string, updateInteractionDto: UpdateInteractionDto) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = {};
    if (updateInteractionDto.interactionType !== undefined) updateData.interaction_type = updateInteractionDto.interactionType;
    if (updateInteractionDto.summary !== undefined) updateData.summary = updateInteractionDto.summary;
    if (updateInteractionDto.date !== undefined) updateData.date = updateInteractionDto.date;
    if (updateInteractionDto.relationshipStrength !== undefined) updateData.relationship_strength = updateInteractionDto.relationshipStrength;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('contact_interactions')
      .update(updateData)
      .eq('id', interactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Delete an interaction
   */
  async deleteInteraction(userId: string, interactionId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('contact_interactions')
      .delete()
      .eq('id', interactionId)
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Interaction deleted successfully' };
  }

  /**
   * Get contact statistics
   */
  async getContactStats(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: contacts, error: contactsError } = await supabase
      .from('professional_contacts')
      .select('id, company, industry, relationship_type')
      .eq('user_id', userId);

    if (contactsError) {
      throw new HttpException(contactsError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { data: interactions, error: interactionsError } = await supabase
      .from('contact_interactions')
      .select('id, date')
      .eq('user_id', userId);

    if (interactionsError) {
      throw new HttpException(interactionsError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Calculate stats
    const totalContacts = contacts.length;
    const totalInteractions = interactions.length;

    const companiesCount = [...new Set(contacts.map(c => c.company).filter(Boolean))].length;
    const industriesCount = [...new Set(contacts.map(c => c.industry).filter(Boolean))].length;

    const relationshipTypes = contacts.reduce((acc, contact) => {
      const type = contact.relationship_type || 'unspecified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalContacts,
      totalInteractions,
      companiesCount,
      industriesCount,
      relationshipTypes,
    };
  }

  /**
   * Sync all contacts - resolve identities and populate connections for existing contacts
   */
  async syncAllContacts(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get all user's contacts
    const { data: contacts, error } = await supabase
      .from('professional_contacts')
      .select('id, email, linkedin_profile_url')
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let synced = 0;
    let skipped = 0;

    // Process each contact
    for (const contact of contacts) {
      try {
        if (contact.email || contact.linkedin_profile_url) {
          await this.resolveContactIdentityAndConnections(userId, contact.id, {
            email: contact.email,
            linkedinProfileUrl: contact.linkedin_profile_url,
          } as any);
          synced++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error syncing contact ${contact.id}:`, error);
        skipped++;
      }
    }

    return {
      message: 'Contact sync completed',
      totalContacts: contacts.length,
      synced,
      skipped,
    };
  }
}
