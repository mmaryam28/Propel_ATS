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
  // UC-056: Save Generated Cover Letter
  // ===============================================================
  async saveCoverLetter(userId: string, data: {
    jobId: string;
    title: string;
    content: string;
    templateSlug?: string;
    tone?: string;
    company?: string;
    jobDescription?: string;
    profileSummary?: string;
  }) {
    const { data: saved, error } = await this.supabase
      .from('saved_cover_letters')
      .insert({
        userId,
        jobId: data.jobId,
        title: data.title,
        content: data.content,
        templateSlug: data.templateSlug || null,
        tone: data.tone || null,
        company: data.company || null,
        jobDescription: data.jobDescription || null,
        profileSummary: data.profileSummary || null,
      })
      .select()
      .single();

    if (error) throw error;
    return saved;
  }

  // ===============================================================
  // UC-056: Update Saved Cover Letter
  // ===============================================================
  async updateCoverLetter(userId: string, id: string, data: {
    title?: string;
    content?: string;
  }) {
    const { data: updated, error } = await this.supabase
      .from('saved_cover_letters')
      .update({
        title: data.title,
        content: data.content,
      })
      .eq('id', id)
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) throw new NotFoundException('Cover letter not found');
    return updated;
  }

  // ===============================================================
  // UC-056: List Saved Cover Letters (All or by Job)
  // ===============================================================
  async listSavedCoverLetters(userId: string, jobId?: string) {
    let query = this.supabase
      .from('saved_cover_letters')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (jobId) {
      query = query.eq('jobId', jobId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // ===============================================================
  // UC-056: Get Single Saved Cover Letter
  // ===============================================================
  async getSavedCoverLetter(userId: string, id: string) {
    const { data, error } = await this.supabase
      .from('saved_cover_letters')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single();

    if (error || !data) throw new NotFoundException('Cover letter not found');
    return data;
  }

  // ===============================================================
  // UC-056: Delete Saved Cover Letter
  // ===============================================================
  async deleteCoverLetter(userId: string, id: string) {
    const { error } = await this.supabase
      .from('saved_cover_letters')
      .delete()
      .eq('id', id)
      .eq('userId', userId);

    if (error) throw error;
    return { success: true };
  }
}
