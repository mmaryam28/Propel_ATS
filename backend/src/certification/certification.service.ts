import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CertificationService {
  constructor(private supabase: SupabaseService) {}

  async create(data: any) {
    const client = this.supabase.getClient();
    const payload: any = {
      user_id: String(data.userId),
      name: data.name,
      issuing_organization: data.issuingOrganization,
      date_earned: new Date(data.dateEarned).toISOString(),
      expiration_date: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
      does_not_expire: !!data.doesNotExpire,
      certification_number: data.certificationNumber,
      document_url: data.documentUrl,
      category: data.category,
      renewal_reminder_days: data.renewalReminderDays,
    };
    
    console.log('CertificationService.create called with userId:', data.userId);
    console.log('Payload for Supabase:', JSON.stringify(payload, null, 2));
    
    try {
      const { data: certification, error } = await client
        .from('certifications')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error during certification.create:', error);
        throw error;
      }
      
      return certification;
    } catch (err) {
      console.error('Error during certification.create:', err);
      throw err;
    }
  }

  async findAllByUser(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('certifications')
      .select('*')
      .eq('user_id', String(userId))
      .order('date_earned', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async findOne(id: number) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('certifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: number, data: any) {
    const client = this.supabase.getClient();
    const payload: any = { ...data };
    if (data.dateEarned) payload.dateEarned = new Date(data.dateEarned).toISOString();
    if (data.expirationDate !== undefined) {
      payload.expirationDate = data.expirationDate ? new Date(data.expirationDate).toISOString() : null;
    }
    
    const { data: certification, error } = await client
      .from('certifications')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return certification;
  }

  async remove(id: number) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('certifications')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async searchOrganizations(q: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('certifications')
      .select('issuing_organization')
      .ilike('issuing_organization', `%${q}%`)
      .limit(10);
    // Remove duplicates
    const orgs = Array.from(new Set(data?.map(c => c.issuing_organization) || []));
    return orgs.map(org => ({ issuingOrganization: org }));
    
    if (error) throw error;
    
    // Remove duplicates
  }
}
