import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateNetworkingEventDto,
  UpdateNetworkingEventDto,
  CreateEventConnectionDto,
  UpdateEventConnectionDto,
} from './dto/networking-event.dto';

@Injectable()
export class NetworkingEventsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllEvents(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('networking_events')
      .select(`
        *,
        event_connections (
          id,
          contact_id,
          follow_up_needed,
          follow_up_due,
          notes,
          professional_contacts (
            id,
            full_name,
            company,
            role
          )
        )
      `)
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getEventById(eventId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('networking_events')
      .select(`
        *,
        event_connections (
          id,
          contact_id,
          follow_up_needed,
          follow_up_due,
          notes,
          professional_contacts (
            id,
            full_name,
            company,
            role,
            email,
            phone,
            linkedin_profile_url
          )
        )
      `)
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) throw new NotFoundException('Event not found');
    return data;
  }

  async createEvent(userId: string, dto: CreateNetworkingEventDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('networking_events')
      .insert({
        user_id: userId,
        event_name: dto.eventName,
        event_date: dto.eventDate,
        location: dto.location,
        goals: dto.goals,
        notes: dto.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEvent(eventId: string, userId: string, dto: UpdateNetworkingEventDto) {
    // Verify ownership
    await this.getEventById(eventId, userId);

    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('networking_events')
      .update({
        event_name: dto.eventName,
        event_date: dto.eventDate,
        location: dto.location,
        goals: dto.goals,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEvent(eventId: string, userId: string) {
    // Verify ownership
    await this.getEventById(eventId, userId);

    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('networking_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    return { message: 'Event deleted successfully' };
  }

  async getEventStats(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get total events
    const { count: totalEvents } = await supabase
      .from('networking_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get upcoming events
    const { count: upcomingEvents } = await supabase
      .from('networking_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('event_date', new Date().toISOString());

    // Get past events
    const { count: pastEvents } = await supabase
      .from('networking_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lt('event_date', new Date().toISOString());

    // Get total connections made
    const { data: events } = await supabase
      .from('networking_events')
      .select('id')
      .eq('user_id', userId);

    const eventIds = events?.map(e => e.id) || [];
    
    let totalConnections = 0;
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from('event_connections')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);
      totalConnections = count || 0;
    }

    // Get pending follow-ups (all connections where follow_up_needed = true)
    let pendingFollowUps = 0;
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from('event_connections')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds)
        .eq('follow_up_needed', true);
      pendingFollowUps = count || 0;
    }

    return {
      totalEvents: totalEvents || 0,
      upcomingEvents: upcomingEvents || 0,
      pastEvents: pastEvents || 0,
      totalConnections,
      pendingFollowUps,
    };
  }

  // Event Connections
  async createEventConnection(userId: string, dto: CreateEventConnectionDto) {
    // Verify event ownership
    await this.getEventById(dto.eventId, userId);

    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('event_connections')
      .insert({
        event_id: dto.eventId,
        contact_id: dto.contactId,
        follow_up_needed: dto.followUpNeeded ?? false,
        follow_up_due: dto.followUpDue,
        notes: dto.notes,
      })
      .select(`
        *,
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateEventConnection(
    connectionId: string,
    userId: string,
    dto: UpdateEventConnectionDto,
  ) {
    const supabase = this.supabaseService.getClient();
    
    // Get connection and verify ownership through event
    const { data: connection, error: fetchError } = await supabase
      .from('event_connections')
      .select('event_id')
      .eq('id', connectionId)
      .single();

    if (fetchError) throw new NotFoundException('Connection not found');

    // Verify event ownership
    await this.getEventById(connection.event_id, userId);

    const { data, error } = await supabase
      .from('event_connections')
      .update({
        follow_up_needed: dto.followUpNeeded,
        follow_up_due: dto.followUpDue,
        notes: dto.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEventConnection(connectionId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get connection and verify ownership through event
    const { data: connection, error: fetchError } = await supabase
      .from('event_connections')
      .select('event_id')
      .eq('id', connectionId)
      .single();

    if (fetchError) throw new NotFoundException('Connection not found');

    // Verify event ownership
    await this.getEventById(connection.event_id, userId);

    const { error } = await supabase
      .from('event_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
    return { message: 'Connection deleted successfully' };
  }

  async getConnectionsNeedingFollowUp(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get user's events
    const { data: events } = await supabase
      .from('networking_events')
      .select('id')
      .eq('user_id', userId);

    const eventIds = events?.map(e => e.id) || [];
    
    if (eventIds.length === 0) return [];

    const { data, error } = await supabase
      .from('event_connections')
      .select(`
        *,
        networking_events (
          id,
          event_name,
          event_date
        ),
        professional_contacts (
          id,
          full_name,
          company,
          role,
          email,
          phone
        )
      `)
      .in('event_id', eventIds)
      .eq('follow_up_needed', true)
      .lte('follow_up_due', new Date().toISOString())
      .order('follow_up_due', { ascending: true });

    if (error) throw error;
    return data;
  }
}
