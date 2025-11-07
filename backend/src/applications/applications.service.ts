import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ApplicationsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('JobApplication')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data || [];
  }

  async create(userId: string, data: any) {
    const client = this.supabase.getClient();
    const { data: application, error } = await client
      .from('JobApplication')
      .insert({ ...data, userId })
      .select()
      .single();
    
    if (error) throw error;
    return application;
  }

  async update(userId: string, id: string, data: any) {
    const client = this.supabase.getClient();
    const { data: application, error } = await client
      .from('JobApplication')
      .update(data)
      .eq('id', Number(id))
      .eq('userId', userId)
      .select();
    
    if (error) throw error;
    return application;
  }

  async remove(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('JobApplication')
      .delete()
      .eq('id', Number(id))
      .eq('userId', userId)
      .select();
    
    if (error) throw error;
    return data;
  }
}
