import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmploymentService {
  constructor(private supabase: SupabaseService) {}

  private toIsoOrNull(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  async create(data: any) {
    const client = this.supabase.getClient();
    const payload: any = {
      user_id: String(data.userId),
      title: data.title,
      company: data.company,
      location: data.location,
      start_date: this.toIsoOrNull(data.startDate),
      end_date: data.current ? null : this.toIsoOrNull(data.endDate),
      current: !!data.current,
      description: data.description
    };

    const { data: employment, error } = await client
      .from('employment')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return employment;
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('employment')
      .select('*')
      .eq('user_id', String(userId))
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findOne(id: number) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('employment')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, updateData: any) {
    const client = this.supabase.getClient();
    const payload: any = {};
    
    if (updateData.title !== undefined) payload.title = updateData.title;
    if (updateData.company !== undefined) payload.company = updateData.company;
    if (updateData.location !== undefined) payload.location = updateData.location;
    if (updateData.startDate !== undefined) payload.start_date = this.toIsoOrNull(updateData.startDate);
    if (updateData.endDate !== undefined) payload.end_date = updateData.current ? null : this.toIsoOrNull(updateData.endDate);
    if (updateData.current !== undefined) {
      payload.current = !!updateData.current;
      if (payload.current) payload.end_date = null;
    }
    if (updateData.description !== undefined) payload.description = updateData.description;

    const { data, error } = await client
      .from('employment')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('employment')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Employment entry deleted successfully' };
  }
}
