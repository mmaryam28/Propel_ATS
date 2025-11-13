import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';
import { completion } from 'litellm';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import type { File } from 'multer';

@Injectable()
export class ResumeService {
  constructor(private readonly supabase: SupabaseService) {}

  // -----------------------------
  // CRUD
  // -----------------------------
  async create(dto: CreateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert(dto)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('userId', userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .update(dto)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('Resume')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Resume deleted successfully' };
  }

  async getTemplates() {
    const { data, error } = await this.supabase
      .getClient()
      .from('ResumeTemplate')
      .select('*');
    if (error) throw new Error(error.message);
    return { templates: data };
  }

  // -----------------------------
  // AI Utility
  // -----------------------------
  private async askAI(prompt: string) {
    const response = await completion({
      model: 'ollama/phi3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    });

    let text = response.choices[0]?.message?.content || '{}';
    text = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('AI ERROR:', err);
      return { error: 'AI backend failed', details: err.message };
    }
  }

  // -----------------------------
  // AI Features
  // -----------------------------
  async generateAI(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are an AI resume assistant.
Analyze this job posting and profile, and return JSON:
{
  "experience": [...],
  "skills": [...],
  "summary": "1-2 sentences"
}

Job Description:
${jobDescription}

Profile:
${JSON.stringify(userProfile, null, 2)}
`;

    return { success: true, aiContent: await this.askAI(prompt) };
  }

  async optimizeSkills(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are optimizing the Skills section of a resume.
Return JSON:
{
  "skills_to_emphasize": [...],
  "skills_to_add": [...],
  "skills_to_remove": [...],
  "skills_match_score": 0-100,
  "notes": "short explanation"
}

Job:
${jobDescription}

User Skills:
${JSON.stringify(userProfile.skills || [], null, 2)}
`;

    return { success: true, optimization: await this.askAI(prompt) };
  }

  async tailorExperience(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are an expert resume writer.
Rewrite experience to match the job.
Return JSON:
{
  "tailored_experience": [...],
  "relevance_score": 0-100,
  "notes": "brief explanation"
}

Job:
${jobDescription}

Experience:
${JSON.stringify(userProfile.experience || [], null, 2)}
`;

    return { success: true, tailored: await this.askAI(prompt) };
  }

  async validateResume(dto: GenerateAIDto) {
    const { userProfile } = dto;

    const prompt = `
You are a professional resume reviewer.
Return JSON:
{
  "grammar_issues": [...],
  "tone_feedback": "...",
  "format_suggestions": [...],
  "missing_sections": [...],
  "overall_score": 0-100,
  "summary": "1-2 sentence summary"
}

Resume:
${JSON.stringify(userProfile, null, 2)}
`;

    return { success: true, validation: await this.askAI(prompt) };
  }

  // -----------------------------
  // FILE UPLOAD + PARSING
  async uploadResume(file: File, userId: string) {
    const filePath = file.path;
    const ext = file.originalname.split('.').pop().toLowerCase();

    let extractedText = '';

    if (ext === 'pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await (pdfParse as any)(buffer);
      extractedText = data.text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (ext === 'txt') {
      extractedText = await fs.readFile(filePath, 'utf8');
    }

    // Save in Supabase
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert({
        userId,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        aiContent: { extractedText },
        sections: {},
        experience: {},
        skills: {},
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return data;
  }
}
