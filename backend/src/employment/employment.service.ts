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
      description: data.description,
      employment_type: data.employmentType ?? null,
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      display_order: data.displayOrder ?? 0,
    };

    console.log('Creating employment with payload:', JSON.stringify(payload, null, 2));

    const { data: employment, error } = await client
      .from('employment')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return employment;
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('employment')
      .select('*')
      .eq('user_id', String(userId))
      .order('display_order', { ascending: false })
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

    if (updateData.current !== undefined) {
      payload.current = !!updateData.current;
      payload.end_date = payload.current ? null : this.toIsoOrNull(updateData.endDate);
    }

    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.employmentType !== undefined) payload.employment_type = updateData.employmentType;
    if (updateData.responsibilities !== undefined) {
      payload.responsibilities = Array.isArray(updateData.responsibilities)
        ? updateData.responsibilities
        : [];
    }
    if (updateData.skills !== undefined) {
      payload.skills = Array.isArray(updateData.skills) ? updateData.skills : [];
    }
    if (updateData.displayOrder !== undefined) payload.display_order = updateData.displayOrder;

    console.log(`Updating employment ${id} with payload:`, JSON.stringify(payload, null, 2));

    const { data, error } = await client
      .from('employment')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

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
