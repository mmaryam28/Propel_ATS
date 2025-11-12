import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config(); // safe to include here too

@Injectable()
export class CoverlettersService {
  private supabase: SupabaseClient;

  constructor() {
    console.log('SUPABASE_URL at service startup:', process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL is missing from environment');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from environment');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

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

  async getTemplateBySlug(slug: string) {
    const { data: tpl, error } = await this.supabase
      .from('cl_templates')
      .select('id, title, slug, description, tokens')
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
}
