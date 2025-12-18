import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ApplicationQualityScorePayload {
  resume: string;
  coverLetter: string;
  linkedIn: string;
  jobDescription: string;
  userId: string;
  jobId?: string;
}

export interface ApplicationQualityScoreResult {
  score: number;
  breakdown: {
    alignment: number;
    formatting: number;
    consistency: number;
  };
  suggestions: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  canSubmit: boolean;
  history?: Array<{ score: number; date: string }>;
}

@Injectable()
export class ApplicationQualityService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async scoreApplication(payload: ApplicationQualityScorePayload): Promise<ApplicationQualityScoreResult> {
    // --- Validate and normalize inputs ---
    const resume = String(payload.resume || '');
    const coverLetter = String(payload.coverLetter || '');
    const linkedIn = String(payload.linkedIn || '');
    const jobDescription = String(payload.jobDescription || '');
    
    // --- Alignment scoring ---
    // Simple keyword matching for demo
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeKeywords = this.extractKeywords(resume);
    const coverLetterKeywords = this.extractKeywords(coverLetter);
    const linkedInKeywords = this.extractKeywords(linkedIn);
    const allKeywords = [...resumeKeywords, ...coverLetterKeywords, ...linkedInKeywords];
    const missingKeywords = jobKeywords.filter(k => !allKeywords.includes(k));
    const alignmentScore = Math.round(((jobKeywords.length - missingKeywords.length) / jobKeywords.length) * 100);

    // --- Formatting scoring ---
    const formattingIssues = this.detectFormattingIssues(resume, coverLetter);
    const formattingScore = formattingIssues.length === 0 ? 100 : Math.max(50, 100 - (formattingIssues.length * 15));

    // --- Consistency scoring ---
    const consistencyScore = this.checkConsistency(resume, coverLetter, linkedIn);

    // --- Suggestions with priority ranking ---
    const suggestions: Array<{ priority: 'high' | 'medium' | 'low'; text: string }> = [];
    
    if (alignmentScore < 50) {
      suggestions.push({ priority: 'high', text: `Add ${missingKeywords.slice(0, 5).join(', ')} to better match job requirements` });
    } else if (missingKeywords.length > 0) {
      suggestions.push({ priority: 'medium', text: `Consider adding keywords: ${missingKeywords.slice(0, 3).join(', ')}` });
    }
    
    if (formattingIssues.length > 0) {
      suggestions.push({ priority: 'high', text: `Fix formatting issues: ${formattingIssues.join(', ')}` });
    }
    
    if (consistencyScore < 80) {
      suggestions.push({ priority: 'medium', text: 'Ensure name, job titles, and key achievements are consistent across all materials' });
    }

    if (alignmentScore < 70) {
      suggestions.push({ priority: 'high', text: 'Tailor your experience bullets to match job description language' });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // --- Final score ---
    const score = Math.round((alignmentScore * 0.5) + (formattingScore * 0.3) + (consistencyScore * 0.2));
    const canSubmit = score >= 70;

    // --- Save to database ---
    const supabase = this.supabaseService.getClient();
    const scoreRecord = await supabase
      .from('application_quality_scores')
      .insert({
        user_id: payload.userId,
        job_id: payload.jobId || null,
        score,
        alignment_score: alignmentScore,
        formatting_score: formattingScore,
        consistency_score: consistencyScore,
        missing_keywords: missingKeywords,
        formatting_issues: formattingIssues,
        suggestions: suggestions,
        can_submit: canSubmit,
        resume_content: resume,
        cover_letter_content: coverLetter,
        linkedin_profile: linkedIn,
        job_description: jobDescription,
      })
      .select()
      .single();

    // --- Fetch history ---
    const { data: history } = await supabase
      .from('application_quality_scores')
      .select('score, created_at')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      score,
      breakdown: {
        alignment: alignmentScore,
        formatting: formattingScore,
        consistency: consistencyScore,
      },
      suggestions: suggestions.map(s => `[${s.priority.toUpperCase()}] ${s.text}`),
      missingKeywords: missingKeywords.slice(0, 10),
      formattingIssues,
      canSubmit,
      history: (history || []).map(h => ({ score: h.score, date: h.created_at })),
    };
  }

  async getScoreHistory(userId: string, jobId?: string) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('application_quality_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getUserStatistics(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('user_quality_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || {
      total_scores: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      avg_alignment: 0,
      avg_formatting: 0,
      avg_consistency: 0,
      submittable_count: 0,
      submittable_percentage: 0,
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple word extraction for demo
    return (text.match(/\b\w{4,}\b/g) || []).map(w => w.toLowerCase());
  }

  private detectFormattingIssues(resume: string, coverLetter: string): string[] {
    const issues: string[] = [];
    if (/\bteh\b|\brecieve\b|\bdefinately\b/i.test(resume + coverLetter)) issues.push('Common typos found');
    if ((resume.match(/\n/g) || []).length < 5) issues.push('Resume may lack section breaks');
    if ((coverLetter.match(/\n/g) || []).length < 3) issues.push('Cover letter may lack paragraphs');
    return issues;
  }

  private checkConsistency(resume: string, coverLetter: string, linkedIn: string): number {
    // For demo, check if name and job titles appear in all
    const nameMatch = /([A-Z][a-z]+\s[A-Z][a-z]+)/.exec(resume);
    const name = nameMatch ? nameMatch[1] : '';
    const inResume = name && resume.includes(name);
    const inCover = name && coverLetter.includes(name);
    const inLinkedIn = name && linkedIn.includes(name);
    return inResume && inCover && inLinkedIn ? 100 : 75;
  }
}
