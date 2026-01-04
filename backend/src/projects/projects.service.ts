import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProjectsService {
  constructor(private supabase: SupabaseService) {}

  private toIsoOrNull(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Transform snake_case to camelCase
  private transformProject(project: any) {
    if (!project) return null;
    return {
      ...project,
      userId: project.user_id,
      startDate: project.start_date,
      endDate: project.end_date,
    };
  }

  async create(data: any) {
    const client = this.supabase.getClient();
    
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    
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
    
    // Handle start_date - required field, use current date if not provided
    const startDate = this.toIsoOrNull(data.startDate);
    if (!startDate) {
      throw new Error('Start date is required for projects');
    }
    
    const payload: any = {
      user_id: String(data.userId),
      name: data.name,
      description: data.description,
      role: data.role,
      start_date: startDate,
      end_date: this.toIsoOrNull(data.endDate),
      technologies: data.technologies ?? [],
      url: data.url || null,
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
    return this.transformProject(project);
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('projects')
      .select('*')
      .eq('user_id', String(userId))
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(p => this.transformProject(p));
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
    
    const transformed = this.transformProject(project);
    return { ...transformed, media: media || [] };
  }

  async update(id: number, data: any) {
    const client = this.supabase.getClient();
    
    // Map camelCase to snake_case
    const payload: any = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.role !== undefined) payload.role = data.role;
    if (data.status !== undefined) {
      const statusMap: Record<string, string> = {
        'Completed': 'COMPLETED',
        'Ongoing': 'ONGOING',
        'Planned': 'PLANNED',
      };
      payload.status = statusMap[data.status] || data.status;
    }
    if (data.technologies !== undefined) payload.technologies = data.technologies;
    if (data.url !== undefined) payload.url = data.url;
    if (data.outcomes !== undefined) payload.outcomes = data.outcomes;
    if (data.industry !== undefined) payload.industry = data.industry;
    
    if (data.startDate !== undefined) {
      payload.start_date = this.toIsoOrNull(data.startDate);
    }
    if (data.endDate !== undefined) {
      payload.end_date = this.toIsoOrNull(data.endDate);
    }
    
      const { data: project, error } = await client
        .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.transformProject(project);
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
    return this.transformProject(data);
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
