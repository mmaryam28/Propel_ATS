import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CoverlettersService {
  private supabase: SupabaseClient;

  constructor() {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL missing');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  // ===============================================================
  // UC-055: List Templates
  // ===============================================================
  async listTemplates(q?: string, category?: string) {
    let query = this.supabase
      .from('cl_templates')
      .select(`
        id,
        title,
        slug,
        description,
        sample_preview,
        tokens,
        category:cl_template_categories(name, slug)
      `)
      .eq('is_active', true);

    if (category) query = query.eq('category.slug', category);
    if (q) query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // ===============================================================
  // UC-055 / UC-056: Get Template + Latest Version
  // ===============================================================
  async getTemplateBySlug(slug: string) {
    const { data: tpl, error } = await this.supabase
      .from('cl_templates')
      .select(`
        id,
        title,
        slug,
        description,
        tokens,
        category:cl_template_categories(name, slug)
      `)
      .eq('slug', slug)
      .single();

    if (error || !tpl) throw new NotFoundException('Template not found');

    const { data: ver, error: e2 } = await this.supabase
      .from('cl_template_versions')
      .select('version, body, changelog, created_at')
      .eq('template_id', tpl.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (e2) throw e2;

    return { ...tpl, latest: ver };
  }

  // ===============================================================
  // Get User's Cover Letters (for A/B Testing dropdown)
  // ===============================================================
  async getUserCoverLetters(userId: string) {
    const { data, error } = await this.supabase
      .from('cover_letters')
      .select('id, title, created_at')
      .eq('userid', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get specific cover letter by ID
  // ===============================================================
  async getCoverLetterById(id: string) {
    const { data, error } = await this.supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // ===============================================================
  // Save Cover Letter as Version
  // ===============================================================
  async saveCoverLetter(userId: string, title: string, content: string, company?: string) {
    const { data, error } = await this.supabase
      .from('cover_letters')
      .insert({
        userid: userId,
        title,
        content: { text: content, company: company || null }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
