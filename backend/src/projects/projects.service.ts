import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProjectsService {
  constructor(private supabase: SupabaseService) {}

  async create(data: any) {
    const client = this.supabase.getClient();
    
    // Map status string to ProjectStatus enum value
    let statusEnum = 'COMPLETED';
    if (typeof data.status === 'string') {
      const statusMap: Record<string, string> = {
        'Completed': 'COMPLETED',
        'Ongoing': 'ONGOING',
        'Planned': 'PLANNED',
      };
      statusEnum = statusMap[data.status] || 'COMPLETED';
    }
    
    const payload: any = {
      user_id: String(data.userId),
      name: data.name,
      description: data.description,
      role: data.role,
      start_date: new Date(data.startDate).toISOString(),
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      technologies: data.technologies ?? [],
      url: data.url,
      team_size: data.teamSize,
      outcomes: data.outcomes,
      industry: data.industry,
      status: statusEnum,
    };
    
      const { data: project, error } = await client
        .from('projects')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return project;
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('projects')
      .select('*')
      .eq('user_id', String(userId))
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findOne(id: number) {
    const client = this.supabase.getClient();
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) throw projectError;
    
    // Fetch associated media
    const { data: media, error: mediaError } = await client
      .from('ProjectMedia')
      .select('*')
      .eq('projectId', id);
    
    if (mediaError) throw mediaError;
    
    return { ...project, media: media || [] };
  }

  async update(id: number, data: any) {
    const client = this.supabase.getClient();
    const payload: any = { ...data };
    if (data.startDate) payload.start_date = new Date(data.startDate).toISOString();
    if (data.endDate !== undefined) {
      payload.end_date = data.endDate ? new Date(data.endDate).toISOString() : null;
    }
    
      const { data: project, error } = await client
        .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return project;
  }

  async remove(id: number) {
    const client = this.supabase.getClient();
    
    // First delete associated media
    await client
      .from('project_media')
      .delete()
      .eq('project_id', id);
    
    // Then delete the project
      const { data, error } = await client
        .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async addMedia(projectId: number, url: string, type = 'IMAGE', caption?: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('project_media')
      .insert({
        project_id: projectId,
        url,
        type,
        caption,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
