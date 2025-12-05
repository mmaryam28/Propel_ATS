import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SuggestedContact, ConnectionPath } from './dto/discovery.dto';

@Injectable()
export class DiscoveryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get suggested contacts for a user based on 2nd-degree connections
   */
  async getSuggestions(userId: string): Promise<SuggestedContact[]> {
    const supabase = this.supabaseService.getClient();

    // Get user's current contacts (1st-degree)
    const { data: userContacts, error: contactsError } = await supabase
      .from('professional_contacts')
      .select('id')
      .eq('user_id', userId);

    if (contactsError) {
      throw new HttpException(contactsError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const userContactIds = userContacts.map(c => c.id);

    if (userContactIds.length === 0) {
      return []; // No contacts, no suggestions
    }

    // Get 2nd-degree connections (contacts of contacts)
    const { data: secondDegreeConnections, error: connectionsError } = await supabase
      .from('contact_connections')
      .select(`
        connected_contact_id,
        contact_id,
        professional_contacts!contact_connections_connected_contact_id_fkey (
          id,
          user_id,
          full_name,
          headline,
          company,
          role,
          industry,
          linkedin_profile_url,
          email,
          phone
        )
      `)
      .in('contact_id', userContactIds);

    if (connectionsError) {
      throw new HttpException(connectionsError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Filter out contacts that:
    // 1. Are already in user's network
    // 2. Belong to the user themselves
    const potentialSuggestions = secondDegreeConnections
      .filter(conn => {
        const contact = conn.professional_contacts as any;
        return contact && 
               !userContactIds.includes(contact.id) &&
               contact.user_id !== userId;
      })
      .map(conn => {
        const contact = conn.professional_contacts as any;
        return {
          id: contact.id,
          user_id: contact.user_id,
          full_name: contact.full_name,
          headline: contact.headline,
          company: contact.company,
          role: contact.role,
          industry: contact.industry,
          linkedin_profile_url: contact.linkedin_profile_url,
          email: contact.email,
          phone: contact.phone,
          via_contact_id: conn.contact_id
        };
      });

    // Remove duplicates (same person suggested through multiple paths)
    const uniqueSuggestions = Array.from(
      new Map(potentialSuggestions.map(item => [item.id, item])).values()
    );

    // Get user's industry and target companies for scoring
    const { data: user } = await supabase
      .from('users')
      .select('industry')
      .eq('id', userId)
      .single();

    const { data: targetCompanies } = await supabase
      .from('user_target_companies')
      .select('company_name')
      .eq('user_id', userId);

    const targetCompanyNames = targetCompanies?.map(tc => tc.company_name.toLowerCase()) || [];

    // Calculate scores and get mutual connections for each suggestion
    const scoredSuggestions: SuggestedContact[] = await Promise.all(
      uniqueSuggestions.map(async (contact) => {
        let score = 1; // Base score
        const scoringDetails = {
          sameIndustry: false,
          hasMutualConnections: false,
          inTargetCompany: false,
        };

        // +1 if same industry
        if (user?.industry && contact.industry && 
            user.industry.toLowerCase() === contact.industry.toLowerCase()) {
          score += 1;
          scoringDetails.sameIndustry = true;
        }

        // Count mutual connections
        const { data: mutualConnections } = await supabase
          .from('contact_connections')
          .select('contact_id')
          .eq('connected_contact_id', contact.id)
          .in('contact_id', userContactIds);

        const mutualConnectionsCount = mutualConnections?.length || 0;

        // +1 if has mutual connections
        if (mutualConnectionsCount > 0) {
          score += 1;
          scoringDetails.hasMutualConnections = true;
        }

        // +1 if in target companies
        if (contact.company && targetCompanyNames.includes(contact.company.toLowerCase())) {
          score += 1;
          scoringDetails.inTargetCompany = true;
        }

        // Get connection path (simplified - showing first path)
        const connectionPath = await this.getSimpleConnectionPath(
          userId,
          contact.id,
          userContactIds
        );

        return {
          id: contact.id,
          full_name: contact.full_name,
          headline: contact.headline,
          company: contact.company,
          role: contact.role,
          industry: contact.industry,
          linkedin_profile_url: contact.linkedin_profile_url,
          email: contact.email,
          phone: contact.phone,
          score,
          mutualConnectionsCount,
          connectionPath,
          scoringDetails,
        };
      })
    );

    // Sort by score (highest first)
    return scoredSuggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Get detailed connection path for a suggested contact
   */
  async getConnectionPath(userId: string, suggestedContactId: string): Promise<ConnectionPath> {
    const supabase = this.supabaseService.getClient();

    // Get user's contacts
    const { data: userContacts, error: contactsError } = await supabase
      .from('professional_contacts')
      .select('id, full_name, company, role')
      .eq('user_id', userId);

    if (contactsError) {
      throw new HttpException(contactsError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const userContactIds = userContacts.map(c => c.id);

    // Get the suggested contact details
    const { data: suggestedContact, error: suggestionError } = await supabase
      .from('professional_contacts')
      .select('*')
      .eq('id', suggestedContactId)
      .single();

    if (suggestionError) {
      throw new HttpException('Suggested contact not found', HttpStatus.NOT_FOUND);
    }

    // Find all mutual connections
    const { data: connections } = await supabase
      .from('contact_connections')
      .select(`
        contact_id,
        professional_contacts!contact_connections_contact_id_fkey (
          id,
          full_name,
          company,
          role
        )
      `)
      .eq('connected_contact_id', suggestedContactId)
      .in('contact_id', userContactIds);

    const mutualConnections = connections?.map(c => {
      const contact = c.professional_contacts as any;
      return {
        id: contact.id,
        full_name: contact.full_name,
        company: contact.company,
        role: contact.role,
      };
    }) || [];

    // Create path through first mutual connection
    const path = mutualConnections.length > 0
      ? [mutualConnections[0]]
      : [];

    return {
      suggestedContact,
      path,
      mutualConnections,
    };
  }

  /**
   * Track user action on a suggestion
   */
  async trackAction(
    userId: string,
    suggestedContactId: string,
    action: string,
    notes?: string
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('contact_suggestions_tracking')
      .insert({
        user_id: userId,
        suggested_contact_id: suggestedContactId,
        action,
        notes,
      });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Helper: Get simple connection path (first mutual connection)
   */
  private async getSimpleConnectionPath(
    userId: string,
    suggestedContactId: string,
    userContactIds: string[]
  ): Promise<string[]> {
    const supabase = this.supabaseService.getClient();

    const { data: connection } = await supabase
      .from('contact_connections')
      .select(`
        professional_contacts!contact_connections_contact_id_fkey (
          full_name
        )
      `)
      .eq('connected_contact_id', suggestedContactId)
      .in('contact_id', userContactIds)
      .limit(1)
      .single();

    if (connection?.professional_contacts) {
      const contact = connection.professional_contacts as any;
      return ['You', contact.full_name];
    }

    return ['You'];
  }
}
