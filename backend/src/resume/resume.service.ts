import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';
import OpenAI from 'openai';

@Injectable()
export class ResumeService {
  private openai: OpenAI;

  constructor(private supabase: SupabaseService) {
    // Initialize OpenAI (for AI resume generation)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Create new resume
  async create(dto: CreateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert([dto])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Get all resumes by userId
  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('userId', userId);

    if (error) throw new Error(error.message);
    return data;
  }

  // Get single resume by ID
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

  // Update resume by ID
  async update(id: string, dto: UpdateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Delete resume by ID
  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('Resume')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Resume deleted successfully' };
  }

  // AI Resume Content Generation
  async generateAI(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
Analyze this job posting and user profile. 
Generate bullet points, relevant skills, and a brief professional summary. 
Return valid JSON with:
{ "experience": [...], "skills": [...], "summary": "..." }

Job Posting:
${jobDescription}

User Profile:
${JSON.stringify(userProfile, null, 2)}
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const text = completion.choices[0]?.message?.content || '{}';
      const json = JSON.parse(text);
      return json;
    } catch (err) {
      console.error('AI Generation Error:', err);
      throw new Error('Failed to generate AI resume content');
    }
  }
}
