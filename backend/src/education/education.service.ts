import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Injectable()
export class EducationService {
  constructor(private supabase: SupabaseService) {}

  async create(data: CreateEducationDto) {
    const client = this.supabase.getClient();
      const payload: any = {
        user_id: String(data.userId),
        degree: data.degree,
        institution: data.institution,
        field_of_study: data.fieldOfStudy,
        start_date: new Date(data.startDate).toISOString(),
        end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
        ongoing: !!data.ongoing,
        gpa: data.gpa ?? null,
        show_gpa: data.showGpa ?? true,
        honors: data.honors ?? [],
        notes: data.notes,
      };
    
    const { data: education, error } = await client
      .from('Education')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return education;
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
    return data || [];
  }

  async findOne(id: number) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('education')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: number, dto: UpdateEducationDto) {
    const client = this.supabase.getClient();
      const data: any = { ...dto };
      if (dto.startDate) data.start_date = new Date(dto.startDate).toISOString();
      if (dto.endDate !== undefined) {
        data.end_date = dto.endDate ? new Date(dto.endDate).toISOString() : null;
      }
    
    const { data: education, error } = await client
      .from('Education')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return education;
  }

  async remove(id: number) {
    const client = this.supabase.getClient();
      const { data, error } = await client
        .from('education')
        .delete()
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
  }
}
