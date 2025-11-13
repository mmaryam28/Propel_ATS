import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';
import { completion } from 'litellm';
import * as fs from 'fs/promises';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import type { Multer } from 'multer';
import { PostgrestError } from '@supabase/supabase-js';



@Injectable()
export class ResumeService {
  constructor(private readonly supabase: SupabaseService) {}
  private readonly ollamaUrl =
    process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  private readonly model = process.env.OLLAMA_MODEL || 'phi3';

  //----------------------------------------------------
  // UTILITIES
  //----------------------------------------------------

  handleError(error: PostgrestError) {
    console.error('Supabase Error:', error);
    throw new BadRequestException(error.message);
  }

  private sanitizeAIResponse(text: string) {
    if (!text) return {};

    // Remove code fences
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Remove JS-style comments
    text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');

    // If not JSON, return raw
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      return { raw: text };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  //----------------------------------------------------
// AI ENGINE (Same style as CoverletterAIService)
//----------------------------------------------------
  private async callAI(prompt: string) {
    try {
      const res = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        console.error('Ollama API Error:', await res.text());
        return { error: 'Failed to generate AI content.' };
      }

      const data: any = await res.json();
      const raw = (data.response || '').trim();

      return this.sanitizeAIResponse(raw);
    } catch (err) {
      console.error('AI Error:', err);
      return { error: 'AI request failed', raw: err.message };
    }
  }



  //----------------------------------------------------
  // CRUD WITH CAMELCASE OUTPUT
  //----------------------------------------------------

  async create(dto: CreateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert({
        userid: dto.userId,
        title: dto.title,
        aicontent: dto.aiContent ?? {},
        experience: dto.experience ?? {},
        skills: dto.skills ?? {},
        sections: dto.sections ?? {},
      })
      .select('*')
      .single();

    if (error) this.handleError(error);

    return this.mapResume(data);
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('userid', userId);

    if (error) this.handleError(error);
    return (data ?? []).map(r => this.mapResume(r));
  }

  async findOne(id: string) {
    if (!id || id === 'undefined')
      throw new BadRequestException('Invalid resume ID');

    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('id', id)
      .single();

    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Resume not found');

    return this.mapResume(data);
  }

  async update(id: string, dto: UpdateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .update({
        userid: dto.userId,
        title: dto.title,
        aicontent: dto.aiContent,
        skills: dto.skills,
        experience: dto.experience,
        sections: dto.sections,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) this.handleError(error);
    return this.mapResume(data);
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('Resume')
      .delete()
      .eq('id', id);

    if (error) this.handleError(error);
    return { message: 'Resume deleted' };
  }

  //----------------------------------------------------
  // TEMPLATE MANAGEMENT
  //----------------------------------------------------
  async getTemplates() {
    const { data, error } = await this.supabase
      .getClient()
      .from('ResumeTemplate')
      .select('*');

    if (error) this.handleError(error);
    return { templates: data ?? [] };
  }

  //----------------------------------------------------
  // AI FEATURES
  //----------------------------------------------------
  async generateAI(dto: GenerateAIDto) {
    const prompt = `
  You are an expert resume writer.

  Generate optimized resume content in clean JSON only.

  Job Description:
  ${dto.jobDescription}

  User Profile:
  ${JSON.stringify(dto.userProfile, null, 2)}

  Guidelines:
  - Return valid JSON only.
  - Improve clarity, action verbs, metrics, and alignment with the job.
  `;

    return { aiContent: await this.callAI(prompt) };
  }

  async optimizeSkills(dto: GenerateAIDto) {
    const prompt = `
  You are an expert resume skill analyst. Return JSON only.

  Rewrite the user's skills to better match the job, but without inventing false skills.

  Job Description:
  ${dto.jobDescription}

  User Skills:
  ${JSON.stringify(dto.userProfile.skills, null, 2)}
  `;

    return { optimization: await this.callAI(prompt) };
  }


  async tailorExperience(dto: GenerateAIDto) {
    const prompt = `
  You are an expert resume editor.

  Rewrite the user's experience to match the job. Keep it truthful.

  Return strictly valid JSON containing improved bullet points.

  Job Description:
  ${dto.jobDescription}

  User Experience:
  ${JSON.stringify(dto.userProfile.experience, null, 2)}
  `;

    return { tailored: await this.callAI(prompt) };
  }


  async validateResume(userProfile: any) {
    const prompt = `
  You are a professional resume reviewer.

  Evaluate the resume and return JSON with:
  - strengths
  - weaknesses
  - missing elements
  - ATS risks (keywords missing)
  - overall score (0–100)

  Resume:
  ${JSON.stringify(userProfile, null, 2)}
  `;

    return { validation: await this.callAI(prompt) };
  }

  
  async uploadResume(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }
    const filePath = file.path;
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();

    let extractedText = '';

    if (ext === 'pdf') {
      const buf = await fs.readFile(filePath);
      const parsed = await pdfParse(buf);
      extractedText = parsed.text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (ext === 'txt') {
      extractedText = await fs.readFile(filePath, 'utf8');
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert({
        userid: userId,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        aicontent: { extractedText },
        skills: {},
        experience: {},
        sections: {},
      })
      .select('*')
      .single();

    if (error) this.handleError(error);
    return this.mapResume(data);
  }

  //----------------------------------------------------
  // SNAKE_CASE → CAMELCASE OUTPUT NORMALIZER
  //----------------------------------------------------
  private mapResume(r: any) {
    return {
      id: r.id,
      userId: r.userid,
      title: r.title,
      aiContent: r.aicontent,
      skills: r.skills,
      experience: r.experience,
      sections: r.sections,
      templateId: r.templateid,
      versionTag: r.versiontag,
      createdAt: r.createdat,
      updatedAt: r.updatedat,
    };
  }
}
