import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CertificationService {
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
      name: data.name,
      issuing_organization: data.issuingOrganization,
      date_earned: this.toIsoOrNull(data.dateEarned),
      // If it does not expire, force expiration_date to null
      expiration_date: data?.doesNotExpire ? null : this.toIsoOrNull(data.expirationDate),
      does_not_expire: !!data?.doesNotExpire,
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
    // Map incoming camelCase fields to DB snake_case columns and sanitize dates
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.issuingOrganization !== undefined) payload.issuing_organization = data.issuingOrganization;
    if (data.dateEarned !== undefined) payload.date_earned = this.toIsoOrNull(data.dateEarned);
    if (data.doesNotExpire !== undefined) payload.does_not_expire = !!data.doesNotExpire;
    if (data.expirationDate !== undefined) {
      payload.expiration_date = data.doesNotExpire ? null : this.toIsoOrNull(data.expirationDate);
    }
    if (data.certificationNumber !== undefined) payload.certification_number = data.certificationNumber;
    if (data.documentUrl !== undefined) payload.document_url = data.documentUrl;
    if (data.category !== undefined) payload.category = data.category;
    if (data.renewalReminderDays !== undefined) payload.renewal_reminder_days = data.renewalReminderDays;
    
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
    if (error) throw error;
    // Remove duplicates
    const orgs = Array.from(new Set(data?.map(c => c.issuing_organization) || []));
    return orgs.map(org => ({ issuingOrganization: org }));
  }
}
