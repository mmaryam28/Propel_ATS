import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';
import { completion } from 'litellm';

@Injectable()
export class ResumeService {
  constructor(private readonly supabase: SupabaseService) {}

  /* ------------------------------------------------------------------
   *                         CRUD OPERATIONS
   * ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
   *                         AI HELPERS
   * ------------------------------------------------------------------ */

  private async askAI(prompt: string) {
    const response = await completion({
      model: process.env.LITELLM_MODEL || 'ollama/mistral',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    });

    const text = response.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  /* ------------------------------------------------------------------
   *                     UC-047: Resume Content Generation
   * ------------------------------------------------------------------ */
  async generateAI(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are an AI resume assistant. 
Analyze this job posting and profile, and return JSON with:
{
  "experience": [...bullet points tailored to job],
  "skills": [...relevant skills],
  "summary": "1-2 sentence summary."
}
Job:
${jobDescription}

Profile:
${JSON.stringify(userProfile, null, 2)}
`;
    return { success: true, aiContent: await this.askAI(prompt) };
  }

  /* ------------------------------------------------------------------
   *                     UC-049: Resume Skills Optimization
   * ------------------------------------------------------------------ */
  async optimizeSkills(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are optimizing the "Skills" section of a resume.
Compare the user's current skills to the job posting.
Return JSON:
{
  "skills_to_emphasize": [...],
  "skills_to_add": [...],
  "skills_to_remove": [...],
  "skills_match_score": 0-100,
  "notes": "short explanation"
}
Job Description:
${jobDescription}

User's Current Skills:
${JSON.stringify(userProfile.skills || [], null, 2)}
`;

    return { success: true, optimization: await this.askAI(prompt) };
  }

  /* ------------------------------------------------------------------
   *                     UC-050: Resume Experience Tailoring
   * ------------------------------------------------------------------ */
  async tailorExperience(dto: GenerateAIDto) {
    const { jobDescription, userProfile } = dto;

    const prompt = `
You are an expert resume writer.
Tailor the user's work experience to the job posting by rewriting bullet points.
Return JSON:
{
  "tailored_experience": [
    {
      "role": "Job title",
      "company": "Company name",
      "updated_bullets": ["...","..."]
    }
  ],
  "relevance_score": 0-100,
  "notes": "brief rationale"
}
Job Description:
${jobDescription}

User's Experience:
${JSON.stringify(userProfile.experience || [], null, 2)}
`;

    return { success: true, tailored: await this.askAI(prompt) };
  }
  async validateResume(dto: GenerateAIDto) {
    const { userProfile } = dto;

    const prompt = `
You are a resume reviewer. Evaluate the following resume content for:
1. Grammar and spelling issues.
2. Professional tone and clarity.
3. Format and length recommendations.
4. Missing key sections (education, contact info, etc.).
5. Overall professionalism (score 0-100).

Return JSON in this format:
{
  "grammar_issues": [...],
  "tone_feedback": "...",
  "format_suggestions": [...],
  "missing_sections": [...],
  "overall_score": number,
  "summary": "1-2 sentence overall feedback."
}

Resume Content:
${JSON.stringify(userProfile, null, 2)}
`;

    return { success: true, validation: await this.askAI(prompt) };
  }


}
