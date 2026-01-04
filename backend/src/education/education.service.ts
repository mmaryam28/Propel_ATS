import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Injectable()
export class EducationService {
  constructor(private supabase: SupabaseService) {}

  private toIsoOrNull(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  async create(data: CreateEducationDto) {
    const client = this.supabase.getClient();
      const payload: any = {
        user_id: String(data.userId),
        degree: data.degree,
        institution: data.institution,
        field_of_study: data.fieldOfStudy,
        start_date: this.toIsoOrNull(data.startDate),
        end_date: this.toIsoOrNull(data.endDate),
        ongoing: !!data.ongoing,
        gpa: data.gpa ?? null,
        show_gpa: data.showGpa ?? true,
        honors: data.honors ?? [],
        notes: data.notes,
      };
    
    const { data: education, error } = await client
      .from('education')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return this.transformEducation(education);
  }

  private transformEducation(edu: any) {
    if (!edu) return edu;
    return {
      id: edu.id,
      userId: edu.user_id,
      degree: edu.degree,
      institution: edu.institution,
      fieldOfStudy: edu.field_of_study,
      startDate: edu.start_date,
      endDate: edu.end_date,
      ongoing: edu.ongoing,
      gpa: edu.gpa,
      showGpa: edu.show_gpa,
      honors: edu.honors,
      notes: edu.notes,
      createdAt: edu.created_at,
      updatedAt: edu.updated_at,
    };
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('education')
        .select('*')
        .eq('user_id', String(userId))
        .order('end_date', { ascending: false })
        .order('start_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(edu => this.transformEducation(edu));
  }

  async findOne(id: string) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('education')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return this.transformEducation(data);
  }

  async update(id: string, dto: UpdateEducationDto) {
    const client = this.supabase.getClient();
    const payload: any = {};
    
    if (dto.degree !== undefined) payload.degree = dto.degree;
    if (dto.institution !== undefined) payload.institution = dto.institution;
    if (dto.fieldOfStudy !== undefined) payload.field_of_study = dto.fieldOfStudy;
    if (dto.startDate !== undefined) payload.start_date = this.toIsoOrNull(dto.startDate);
    if (dto.endDate !== undefined) payload.end_date = this.toIsoOrNull(dto.endDate);
    if (dto.ongoing !== undefined) payload.ongoing = dto.ongoing;
    if (dto.gpa !== undefined) payload.gpa = dto.gpa;
    if (dto.showGpa !== undefined) payload.show_gpa = dto.showGpa;
    if (dto.honors !== undefined) payload.honors = dto.honors;
    if (dto.notes !== undefined) payload.notes = dto.notes;
    // Note: education_level column doesn't exist in database, so we skip it
    
    console.log('Updating education id:', id, 'with payload:', payload);
    
    const { data: education, error } = await client
      .from('education')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    console.log('Update result:', { education, error });
    if (error) throw error;
    return this.transformEducation(education);
  }

  async remove(id: string) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('education')
        .delete()
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return this.transformEducation(data);
  }
}
