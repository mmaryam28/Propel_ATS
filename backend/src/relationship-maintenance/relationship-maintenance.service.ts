import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';

@Injectable()
export class RelationshipMaintenanceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get suggested industry contacts based on user's profile
   * Algorithm:
   * 1. Same industry as user's employment/interests
   * 2. Alumni connections (same education institution)
   * 3. Event participants from networking events
   * 4. 2nd degree connections (contacts of contacts)
   */
  async getSuggestedContacts(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get user's industries from employment and existing contacts
    const { data: userIndustries } = await supabase
      .from('employment')
      .select('company')
      .eq('user_id', userId);

    const { data: existingContacts } = await supabase
      .from('professional_contacts')
      .select('industry, company')
      .eq('user_id', userId);

    // Get user's education for alumni matching
    const { data: userEducation } = await supabase
      .from('education')
      .select('institution')
      .eq('user_id', userId);

    // Get contacts from events user attended
    const { data: eventContacts } = await supabase
      .from('event_connections')
      .select(`
        contact_id,
        professional_contacts (
          id,
          full_name,
          headline,
          company,
          role,
          industry,
          linkedin_profile_url
        )
      `)
      .eq('professional_contacts.user_id', userId);

    // Extract unique industries and companies
    const industries = new Set(existingContacts?.map(c => c.industry).filter(Boolean) || []);
    const companies = new Set([
      ...(userIndustries?.map(e => e.company) || []),
      ...(existingContacts?.map(c => c.company).filter(Boolean) || []),
    ]);

    // Find contacts in same industries (not already connected)
    const { data: industryMatches } = await supabase
      .from('professional_contacts')
      .select('*')
      .neq('user_id', userId)
      .in('industry', Array.from(industries))
      .limit(20);

    // Find alumni connections
    const institutions = userEducation?.map(e => e.institution) || [];
    const { data: alumniMatches } = await supabase
      .from('education')
      .select(`
        user_id,
        institution,
        users (
          id,
          firstname,
          lastname,
          email
        )
      `)
      .in('institution', institutions)
      .neq('user_id', userId)
      .limit(10);

    // Format suggestions with connection paths
    const suggestions: any[] = [];

    // Industry-based suggestions
    if (industryMatches) {
      suggestions.push(
        ...industryMatches.map(contact => ({
          ...contact,
          suggestionReason: 'Same Industry',
          connectionPath: [`Works in ${contact.industry}`],
          matchScore: 75,
        })),
      );
    }

    // Alumni suggestions
    if (alumniMatches) {
      suggestions.push(
        ...alumniMatches.map((match: any) => {
          const user = Array.isArray(match.users) ? match.users[0] : match.users;
          return {
            id: match.user_id,
            full_name: `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
            headline: `Alumni from ${match.institution}`,
            company: null,
            role: null,
            industry: null,
            email: user?.email,
            suggestionReason: 'Alumni Connection',
            connectionPath: [`Both attended ${match.institution}`],
            matchScore: 85,
          };
        }),
      );
    }

    // Event-based suggestions
    if (eventContacts) {
      suggestions.push(
        ...eventContacts.map((ec: any) => ({
          ...ec.professional_contacts,
          suggestionReason: 'Met at Event',
          connectionPath: ['Met at networking event'],
          matchScore: 80,
        })),
      );
    }

    // Sort by match score
    return suggestions.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get connection path between user and a suggested contact
   * Shows mutual connections or shared affiliations
   */
  async getConnectionPath(userId: string, targetContactId: string) {
    const supabase = this.supabaseService.getClient();

    // Get user's contacts
    const { data: userContacts } = await supabase
      .from('professional_contacts')
      .select('id, full_name, company, linkedin_profile_url')
      .eq('user_id', userId);

    // Get target contact details
    const { data: targetContact } = await supabase
      .from('professional_contacts')
      .select('*')
      .eq('id', targetContactId)
      .single();

    if (!targetContact) {
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }

    const paths: any[] = [];

    // Check for shared company
    const sameCompanyContact = userContacts?.find(c => c.company === targetContact.company);
    if (sameCompanyContact) {
      paths.push({
        type: 'company',
        description: `${sameCompanyContact.full_name} also works at ${targetContact.company}`,
        mutualContact: sameCompanyContact,
      });
    }

    // Check for shared events
    const { data: sharedEvents } = await supabase
      .from('event_connections')
      .select(`
        event_id,
        networking_events (
          event_name,
          event_date
        )
      `)
      .eq('contact_id', targetContactId);

    if (sharedEvents && sharedEvents.length > 0) {
      const eventData: any = sharedEvents[0].networking_events;
      const event = Array.isArray(eventData) ? eventData[0] : eventData;
      paths.push({
        type: 'event',
        description: `Met at ${event?.event_name || 'networking event'}`,
        event: event,
      });
    }

    // Check for alumni connection
    const { data: userEducation } = await supabase
      .from('education')
      .select('institution')
      .eq('user_id', userId);

    const { data: targetEducation } = await supabase
      .from('education')
      .select('institution')
      .eq('user_id', targetContact.user_id);

    const sharedInstitutions = userEducation?.filter(ue =>
      targetEducation?.some(te => te.institution === ue.institution),
    );

    if (sharedInstitutions && sharedInstitutions.length > 0) {
      paths.push({
        type: 'alumni',
        description: `Both attended ${sharedInstitutions[0].institution}`,
        institution: sharedInstitutions[0].institution,
      });
    }

    return {
      targetContact,
      paths,
      degree: paths.length > 0 ? 2 : 3, // 2nd degree if paths found, 3rd otherwise
    };
  }

  /**
   * Get all reminders for a user
   */
  async getReminders(userId: string, status?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('relationship_maintenance_reminders')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          headline,
          company,
          role,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .order('reminder_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(userId: string) {
    const supabase = this.supabaseService.getClient();

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const { data, error } = await supabase
      .from('relationship_maintenance_reminders')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          headline,
          company,
          role,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('reminder_date', now.toISOString())
      .lte('reminder_date', sevenDaysFromNow.toISOString())
      .order('reminder_date', { ascending: true });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(userId: string) {
    const supabase = this.supabaseService.getClient();

    const now = new Date();

    const { data, error } = await supabase
      .from('relationship_maintenance_reminders')
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          headline,
          company,
          role,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('reminder_date', now.toISOString())
      .order('reminder_date', { ascending: true });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Create a new reminder
   */
  async createReminder(userId: string, createReminderDto: CreateReminderDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('relationship_maintenance_reminders')
      .insert({
        user_id: userId,
        contact_id: createReminderDto.contactId,
        reminder_date: createReminderDto.reminderDate,
        reminder_type: createReminderDto.reminderType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Update a reminder
   * If status is changed to 'completed', automatically create an interaction
   */
  async updateReminder(reminderId: string, userId: string, updateReminderDto: UpdateReminderDto) {
    const supabase = this.supabaseService.getClient();

    // Get the reminder details first
    const { data: reminder, error: reminderError } = await supabase
      .from('relationship_maintenance_reminders')
      .select('contact_id, status, reminder_type')
      .eq('id', reminderId)
      .eq('user_id', userId)
      .single();

    if (reminderError || !reminder) {
      throw new HttpException('Reminder not found', HttpStatus.NOT_FOUND);
    }

    // If reminder is being completed and wasn't already completed, create an interaction first
    if (updateReminderDto.status === 'completed' && reminder.status !== 'completed') {
      // Get current average relationship strength for this contact
      const { data: interactions } = await supabase
        .from('contact_interactions')
        .select('relationship_strength')
        .eq('contact_id', reminder.contact_id);

      const interactionArray = interactions || [];
      const currentAvg = interactionArray.length > 0
        ? interactionArray.reduce((sum, i) => sum + (i.relationship_strength || 50), 0) / interactionArray.length
        : 50;

      // Add 7 points to the average for completing the reminder
      const newStrength = Math.min(100, Math.round(currentAvg + 7));

      // Create an interaction record
      const interactionType = this.getInteractionTypeFromReminderType(reminder.reminder_type);
      
      const { error: interactionError } = await supabase
        .from('contact_interactions')
        .insert({
          user_id: userId,
          contact_id: reminder.contact_id,
          interaction_type: interactionType,
          summary: `Completed ${reminder.reminder_type.replace(/_/g, ' ')} reminder`,
          date: new Date().toISOString(),
          relationship_strength: newStrength,
        });

      if (interactionError) {
        console.error('Error creating interaction:', interactionError);
      }
    }

    // Update the reminder
    const { data, error } = await supabase
      .from('relationship_maintenance_reminders')
      .update({
        ...updateReminderDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Helper method to map reminder types to interaction types
   */
  private getInteractionTypeFromReminderType(reminderType: string): string {
    const mapping: Record<string, string> = {
      follow_up: 'follow_up',
      check_in: 'phone_call',
      birthday: 'other',
      anniversary: 'other',
      reconnect: 'email',
      custom: 'other',
    };
    return mapping[reminderType] || 'other';
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('relationship_maintenance_reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Reminder deleted successfully' };
  }

  /**
   * Auto-generate reminders for contacts with no recent interactions
   */
  async autoGenerateReminders(userId: string, daysSinceLastContact: number = 60) {
    const supabase = this.supabaseService.getClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastContact);

    // Find contacts with no recent interactions
    const { data: contacts } = await supabase
      .from('professional_contacts')
      .select(`
        id,
        full_name,
        created_at,
        contact_interactions (
          date
        )
      `)
      .eq('user_id', userId);

    const remindersToCreate: any[] = [];

    for (const contact of contacts || []) {
      const lastInteraction = contact.contact_interactions?.[0]?.date;
      const lastContactDate = lastInteraction ? new Date(lastInteraction) : new Date(contact.created_at);

      if (lastContactDate < cutoffDate) {
        // Check if reminder already exists
        const { data: existingReminder } = await supabase
          .from('relationship_maintenance_reminders')
          .select('id')
          .eq('user_id', userId)
          .eq('contact_id', contact.id)
          .eq('status', 'pending')
          .single();

        if (!existingReminder) {
          remindersToCreate.push({
            user_id: userId,
            contact_id: contact.id,
            reminder_date: new Date().toISOString(),
            reminder_type: 'reconnect',
            status: 'pending',
          });
        }
      }
    }

    if (remindersToCreate.length > 0) {
      const { data, error } = await supabase
        .from('relationship_maintenance_reminders')
        .insert(remindersToCreate)
        .select();

      if (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data;
    }

    return [];
  }

  /**
   * Get relationship health score for all contacts
   */
  async getRelationshipHealthScores(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: contacts } = await supabase
      .from('professional_contacts')
      .select(`
        id,
        full_name,
        company,
        role,
        created_at,
        contact_interactions (
          id,
          date,
          relationship_strength
        )
      `)
      .eq('user_id', userId);

    return contacts?.map(contact => {
      const interactions = contact.contact_interactions || [];
      const lastInteraction = interactions[0]?.date ? new Date(interactions[0].date) : new Date(contact.created_at);
      const daysSinceLastContact = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
      
      const interactionCount = interactions.length;
      const avgStrength = interactions.reduce((sum, i) => sum + (i.relationship_strength || 3), 0) / (interactions.length || 1);

      // Calculate health score (0-100)
      let healthScore = 100;
      
      // Deduct points for infrequent contact
      if (daysSinceLastContact > 90) healthScore -= 40;
      else if (daysSinceLastContact > 60) healthScore -= 25;
      else if (daysSinceLastContact > 30) healthScore -= 10;

      // Add points for interaction count
      healthScore += Math.min(interactionCount * 5, 20);

      // Add points for relationship strength
      healthScore += (avgStrength - 3) * 10;

      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        contactId: contact.id,
        fullName: contact.full_name,
        company: contact.company,
        role: contact.role,
        healthScore: Math.round(healthScore),
        daysSinceLastContact,
        interactionCount,
        avgRelationshipStrength: Math.round(avgStrength * 10) / 10,
        status: healthScore >= 70 ? 'healthy' : healthScore >= 40 ? 'needs_attention' : 'at_risk',
      };
    }).sort((a, b) => a.healthScore - b.healthScore);
  }
}
