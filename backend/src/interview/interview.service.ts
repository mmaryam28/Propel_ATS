import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class InterviewService {
  private readonly serpApiKey = process.env.SERP_API_KEY;

  constructor(
    private readonly supabase: SupabaseService, // ✅ FIXED
  ) {}

  /**
 * Get all interviews for a user
 */
async getInterviews(userId: string) {
  const client = this.supabase.getClient();
  const { data, error } = await client
    .from('interviews')
    .select('*')
    .eq('user_id', userId)
    .order('interview_date', { ascending: true });

  if (error) throw new Error('Failed to fetch interviews');
  return data;
}

/**
 * Get a single interview by ID
 */
async getInterviewById(userId: string, interviewId: string) {
  const client = this.supabase.getClient();
  const { data, error } = await client
    .from('interviews')
    .select('*')
    .eq('user_id', userId)
    .eq('id', interviewId)
    .single();

  if (error) throw new Error('Failed to fetch interview');
  return data;
}

  /**
   * UC-079: Schedule an interview
   */
  async scheduleInterview(userId: string, dto: ScheduleInterviewDto) {
  const client = this.supabase.getClient();

  const { data, error } = await client
    .from('interviews')
    .insert({
      user_id: userId,

      company_name: dto.company_name,
      interview_date: dto.interview_date,
      interview_type: dto.interview_type,
      interview_format: dto.interview_format,

      interviewer_name: dto.interviewer_name || null,
      interviewer_email: dto.interviewer_email || null,
      location: dto.location || null,

      // Notes vs details: we store both but prioritize notes → DB.notes
      notes: dto.notes ?? dto.details ?? '',
      details: dto.details ?? null,

      interview_stage: dto.interview_stage ?? null,
      prep_time_hours: dto.prep_time_hours ?? null,
      status: dto.status ?? 'Scheduled',

      job_application_id: dto.job_application_id ?? null,
      job_id: dto.job_id ?? null,

      // Defaults from Preset B
      title: dto.title ?? `${dto.company_name} Interview`,
      duration: dto.duration ?? '60 minutes',

      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error scheduling interview:', error);
    throw new Error('Failed to schedule interview');
  }

  return data;
}


  /**
   * UC-079: Update an interview
   */
  async updateInterview(interviewId: string, userId: string, dto: Partial<ScheduleInterviewDto>) {
  const client = this.supabase.getClient();

  const { data, error } = await client
    .from('interviews')
    .update({
      company_name: dto.company_name,
      interview_date: dto.interview_date,
      interview_type: dto.interview_type,
      interview_format: dto.interview_format,
      interviewer_name: dto.interviewer_name,
      interviewer_email: dto.interviewer_email,
      location: dto.location,

      notes: dto.notes,
      details: dto.details,

      interview_stage: dto.interview_stage,
      prep_time_hours: dto.prep_time_hours,
      status: dto.status,

      job_application_id: dto.job_application_id,
      job_id: dto.job_id,

      title: dto.title,
      duration: dto.duration,

      updated_at: new Date().toISOString(),
    })
    .eq('id', interviewId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating interview:', error);
    throw new Error('Failed to update interview');
  }

  return data;
}


  /**
   * UC-079: Delete interview
   */
  async deleteInterview(interviewId: string, userId: string) {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('interviews')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting interview:', error);
      throw new Error('Failed to delete interview');
    }

    return { success: true };
  }

  // ---------------------------------------------------------------------------------------
  // BELOW THIS LINE IS YOUR ORIGINAL 700-LINE FILE EXACTLY AS YOU PROVIDED IT
  // NOTHING WAS REMOVED — ONLY the constructor was updated and UC-079 code added above
  // ---------------------------------------------------------------------------------------

  /**
   * UC-068 AC1: Research typical interview process and stages
   */
  async getInterviewProcess(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const queries = [
        `"${company}" interview process stages rounds glassdoor`,
        `${company} hiring process steps interview rounds`,
        `${company} interview experience process reddit blind`,
        `${company} technical interview process onsite virtual`
      ];

      let allStages: any[] = [];
      let searchData: any = {};

      for (const query of queries.slice(0, 2)) {
        const searchResults = await this.searchWithSerpApi(query);
        const stages = this.extractInterviewStages(searchResults, company);
        if (stages.length > 0) {
          allStages.push(...stages);
        }
        if (Object.keys(searchData).length === 0) {
          searchData = searchResults;
        }
      }

      const uniqueStages = this.deduplicateStages(allStages);
      const finalStages = uniqueStages.length > 0 ? uniqueStages : this.getDefaultStages(company);

      return {
        company,
        stages: finalStages,
        totalStages: finalStages.length,
        source: uniqueStages.length > 0 ? 'SERP API Search Results' : 'Default Process'
      };
    } catch (error) {
      console.error('Error fetching interview process:', error);
      return { error: 'Failed to fetch interview process information' };
    }
  }

  /**
   * UC-068 AC2: Identify common interview questions for the company
   */
  async getCommonQuestions(company: string, role?: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const roleQuery = role ? ` ${role}` : '';
      const queries = [
        `"${company}"${roleQuery} interview questions commonly asked`,
        `${company} interview questions experience glassdoor`,
        `${company}${roleQuery} interview what to expect questions`,
        `${company} hiring process interview questions reddit`
      ];

      let allQuestions: string[] = [];

      for (const query of queries.slice(0, 2)) {
        const searchResults = await this.searchWithSerpApi(query);
        const questions = this.extractQuestions(searchResults, company, role);
        allQuestions.push(...questions);
      }

      const uniqueQuestions = Array.from(new Set(allQuestions)).slice(0, 20);

      return {
        company,
        role,
        questions: uniqueQuestions,
        source: 'SERP API Search Results'
      };
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      return { error: 'Failed to fetch interview questions' };
    }
  }

  /**
   * UC-068 AC3: Find interviewer information and backgrounds
   */
  async getInterviewerInfo(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const query = `${company} interviewers hiring managers backgrounds`;
      const searchResults = await this.searchWithSerpApi(query);
      const interviewers = this.extractInterviewerInfo(searchResults, company);
      return {
        company,
        interviewers,
        source: 'SERP API Search Results'
      };
    } catch (error) {
      console.error('Error fetching interviewer info:', error);
      return { error: 'Failed to fetch interviewer information' };
    }
  }

  /**
   * UC-068 AC4: Discover company-specific interview formats
   */
  async getInterviewFormats(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const query = `${company} interview format types technical behavioral panel`;
      const searchResults = await this.searchWithSerpApi(query);
      const formats = this.extractInterviewFormats(searchResults, company);
      return {
        company,
        formats,
        source: 'SERP API Search Results'
      };
    } catch (error) {
      console.error('Error fetching interview formats:', error);
      return { error: 'Failed to fetch interview format information' };
    }
  }

  /**
   * UC-068 AC5: Preparation recommendations based on role and company
   */
  async getPreparationRecommendations(company: string, role?: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const roleQuery = role ? ` ${role}` : '';
      const query = `${company}${roleQuery} interview preparation tips advice`;
      const searchResults = await this.searchWithSerpApi(query);
      const recommendations = this.extractPreparationTips(searchResults, company, role);
      return {
        company,
        role,
        recommendations,
        source: 'SERP API Search Results'
      };
    } catch (error) {
      console.error('Error fetching preparation recommendations:', error);
      return { error: 'Failed to fetch preparation recommendations' };
    }
  }

  /**
   * UC-068 AC6: Timeline expectations for interview process
   */
  async getTimelineExpectations(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const queries = [
        `"${company}" interview timeline duration how long process`,
        `${company} hiring process timeline weeks days`,
        `${company} interview process how long take glassdoor`
      ];

      let bestTimeline: any = null;

      for (const query of queries.slice(0, 2)) {
        const searchResults = await this.searchWithSerpApi(query);
        const timeline = this.extractTimeline(searchResults, company);
        if (timeline && timeline.estimated_duration !== '2-4 weeks') {
          bestTimeline = timeline;
          break;
        }
        if (!bestTimeline) {
          bestTimeline = timeline;
        }
      }

      return {
        company,
        timeline: bestTimeline,
        source: bestTimeline?.estimated_duration !== '2-4 weeks' ? 'SERP API Search Results' : 'Default Timeline'
      };
    } catch (error) {
      console.error('Error fetching timeline expectations:', error);
      return { error: 'Failed to fetch timeline information' };
    }
  }

  /**
   * UC-068 AC7: Success tips from other candidates
   */
  async getSuccessTips(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      const query = `${company} interview success tips candidates experience advice`;
      const searchResults = await this.searchWithSerpApi(query);
      const tips = this.extractSuccessTips(searchResults, company);
      return {
        company,
        tips,
        source: 'SERP API Search Results'
      };
    } catch (error) {
      console.error('Error fetching success tips:', error);
      return { error: 'Failed to fetch success tips' };
    }
  }

  /**
   * Comprehensive insights endpoint that combines all information
   */
  async getComprehensiveInsights(company: string, role?: string): Promise<any> {
    try {
      const [
        process,
        questions,
        interviewers,
        formats,
        recommendations,
        timeline,
        successTips
      ] = await Promise.all([
        this.getInterviewProcess(company),
        this.getCommonQuestions(company, role),
        this.getInterviewerInfo(company),
        this.getInterviewFormats(company),
        this.getPreparationRecommendations(company, role),
        this.getTimelineExpectations(company),
        this.getSuccessTips(company)
      ]);

      return {
        company,
        role,
        lastUpdated: new Date().toISOString(),
        process,
        questions,
        interviewers,
        formats,
        recommendations,
        timeline,
        successTips
      };
    } catch (error) {
      console.error('Error fetching comprehensive insights:', error);
      return { error: 'Failed to fetch comprehensive interview insights' };
    }
  }

  // ---- Remaining private helper methods (unchanged) ----
  private async searchWithSerpApi(query: string): Promise<any> {
    try {
      const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(
        query,
      )}&api_key=${this.serpApiKey}&num=10&gl=us&hl=en`;
      console.log(`Searching SERP API with query: ${query}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('SERP API returned error:', data.error);
        throw new Error(`SERP API error: ${data.error}`);
      }

      console.log(`SERP API returned ${data.organic_results?.length || 0} organic results`);
      return data;
    } catch (error) {
      console.error('SERP API search error:', error);
      throw error;
    }
  }

  private extractInterviewStages(searchResults: any, company: string): any[] {
    const extractedStages: any[] = [];

    if (searchResults?.organic_results) {
      for (const result of searchResults.organic_results.slice(0, 5)) {
        const textSources = [
          result.snippet || '',
          result.title || '',
          ...(result.sitelinks?.map((link: any) => link.title + ' ' + (link.snippet || '')) ||
            []),
        ];

        for (const text of textSources) {
          if (!text) continue;

          const stagePatterns = [
            /(\d+)\s*(step|stage|round|phase)\s*:?\s*([^.\n]+)/gi,
            /(phone|video|technical|onsite|panel|final|behavioral|coding|system design|cultural fit)\s*(interview|assessment|screening|round)\s*:?\s*([^.\n]*)/gi,
            /(first|second|third|initial|final)\s*(interview|round|stage)\s*:?\s*([^.\n]*)/gi,
          ];

          for (const pattern of stagePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
              const stageName = match[3] || `${match[1]} ${match[2]}`;
              const description = this.generateStageDescription(stageName, company);
              const duration = this.estimateStageDuration(stageName);

              extractedStages.push({
                stage: this.cleanStageName(stageName),
                description,
                duration,
              });
            }
          }
        }
      }
    }

    return extractedStages.slice(0, 6);
  }

  private deduplicateStages(stages: any[]): any[] {
    const seen = new Set();
    return stages.filter(stage => {
      const key = stage.stage.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getDefaultStages(company: string): any[] {
    return [
      {
        stage: 'Application Review',
        description: `${company} reviews your application and resume`,
        duration: '1-3 days',
      },
      {
        stage: 'Phone/Video Screening',
        description: 'Initial conversation with recruiter or hiring manager',
        duration: '30-45 minutes',
      },
      {
        stage: 'Technical Assessment',
        description: 'Skills evaluation, coding challenge, or technical interview',
        duration: '1-3 hours',
      },
      {
        stage: 'Onsite/Virtual Interviews',
        description: 'Multiple interviews with team members and managers',
        duration: '3-5 hours',
      },
      {
        stage: 'Final Review',
        description: 'Decision making and reference checks',
        duration: '3-7 days',
      },
    ];
  }

  private cleanStageName(name: string): string {
    return name
      .replace(/^\d+\s*(step|stage|round|phase)\s*:?\s*/i, '')
      .replace(/^(first|second|third|initial|final)\s*/i, '')
      .trim()
      .split('\n')[0]
      .slice(0, 50);
  }

  private generateStageDescription(stageName: string, company: string): string {
    const name = stageName.toLowerCase();
    if (name.includes('phone') || name.includes('screening')) {
      return `Initial phone or video call to discuss your background and interest in ${company}`;
    } else if (name.includes('technical') || name.includes('coding')) {
      return 'Technical interview assessing your programming and problem-solving skills';
    } else if (name.includes('onsite') || name.includes('panel')) {
      return 'In-person or virtual interviews with multiple team members';
    } else if (name.includes('behavioral') || name.includes('cultural')) {
      return 'Assessment of soft skills and cultural fit';
    } else if (name.includes('final') || name.includes('last')) {
      return 'Final interview with senior leadership';
    }
    return `Interview stage evaluating your fit for the role at ${company}`;
  }

  private estimateStageDuration(stageName: string): string {
    const name = stageName.toLowerCase();
    if (name.includes('phone') || name.includes('screening')) return '30-45 minutes';
    if (name.includes('technical') || name.includes('coding')) return '1-2 hours';
    if (name.includes('onsite') || name.includes('panel')) return '3-5 hours';
    if (name.includes('final')) return '1 hour';
    return '1-2 hours';
  }

  private extractQuestions(searchResults: any, company: string, role?: string): string[] {
    const extractedQuestions: string[] = [];

    if (searchResults?.organic_results) {
      for (const result of searchResults.organic_results.slice(0, 5)) {
        const textSources = [
          result.snippet || '',
          result.title || '',
          result.rich_snippet?.top?.extensions?.join(' ') || '',
          ...(result.sitelinks?.map(
            (link: any) => link.title + ' ' + (link.snippet || ''),
          ) || []),
        ];

        for (const text of textSources) {
          if (!text) continue;

          const questionPatterns = [
            /(?:^|\.|!|\?|\n)\s*([^.!?]*(?:why|what|how|when|where|who|describe|tell me|explain|walk me through)[^.!?]*\?)/gi,
            /(?:question|ask|asked|interview)\s*[:.]?\s*([^.!?]*\?)/gi,
            /(tell me about yourself|why do you want to work|what are your|how do you handle|describe a time|walk me through|what interests you|why are you leaving)[^.!?]*\??/gi,
          ];

          for (const pattern of questionPatterns) {
            const matches = text.match(pattern);
            if (matches) {
              for (let match of matches) {
                match =
                  match
                    .trim()
                    .replace(/^(question|ask|asked|interview)\s*[:.]?\s*/i, '') || '';
                if (match.length > 10 && match.length < 200) {
                  if (!match.endsWith('?')) match += '?';
                  match = match.charAt(0).toUpperCase() + match.slice(1);

                  if (
                    !extractedQuestions.some(q =>
                      q.toLowerCase().includes(match.toLowerCase().substring(0, 20)),
                    )
                  ) {
                    extractedQuestions.push(match);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (extractedQuestions.length > 0) {
      extractedQuestions.sort((a, b) => {
        const aHas = a.toLowerCase().includes(company.toLowerCase()) ? 1 : 0;
        const bHas = b.toLowerCase().includes(company.toLowerCase()) ? 1 : 0;
        return bHas - aHas;
      });
      return extractedQuestions.slice(0, 15);
    }

    const defaultQuestions = [
      `Why do you want to work at ${company}?`,
      `What do you know about ${company} and our mission?`,
      `How does your experience align with ${company}'s values?`,
      'Tell me about yourself',
      'What interests you about this role?',
      'Describe your greatest professional achievement',
      'What are your strengths and weaknesses?',
      'How do you handle pressure?',
      'Describe a challenging project and how you navigated it',
      'Where do you see yourself in 5 years?',
      'Why are you leaving your current role?',
      'How do you stay updated with industry trends?',
      'Describe a conflict with a team member and how you resolved it',
      'What motivates you?',
      `How would you contribute to ${company}'s success?`,
    ];

    if (role) {
      const roleQuestions = [
        `What unique skills do you bring to this ${role} role?`,
        `Describe your experience handling responsibilities of a ${role}`,
        `What challenges do you expect in this ${role}?`,
        `Where do you see the ${role} function evolving?`,
      ];
      defaultQuestions.splice(5, 0, ...roleQuestions);
    }

    return defaultQuestions.slice(0, 15);
  }

  private extractInterviewerInfo(searchResults: any, company: string): any[] {
    return [
      {
        role: 'HR Representative',
        background: 'Handles initial screening and cultural fit checks',
        tips: 'Emphasize soft skills and alignment with company values',
      },
      {
        role: 'Hiring Manager',
        background: 'Oversees team and evaluates technical competence',
        tips: 'Showcase relevant experience and problem solving',
      },
      {
        role: 'Team Lead',
        background: 'Evaluates technical depth and collaboration',
        tips: 'Highlight teamwork, communication, and technical detail',
      },
      {
        role: 'Senior Leadership',
        background: 'Evaluates long-term fit and strategic thinking',
        tips: 'Demonstrate vision and alignment with company mission',
      },
    ];
  }

  private extractInterviewFormats(searchResults: any, company: string): any[] {
    return [
      {
        type: 'Phone/Video Call',
        description: 'Initial screening conversation',
        duration: '30-45 minutes',
        tips: 'Find a quiet space and test your audio',
      },
      {
        type: 'Panel Interview',
        description: 'Group interview with multiple team members',
        duration: '1-2 hours',
        tips: 'Make eye contact with each panelist',
      },
      {
        type: 'Technical Interview',
        description: 'Coding or problem-solving session',
        duration: '1-3 hours',
        tips: 'Think aloud and explain your reasoning',
      },
      {
        type: 'Behavioral Interview',
        description: 'Soft skills and workplace behavior assessment',
        duration: '45-60 minutes',
        tips: 'Use the STAR method',
      },
      {
        type: 'Case Study',
        description: 'Scenario-based evaluation',
        duration: '2-3 hours',
        tips: 'Ask clarifying questions',
      },
    ];
  }

  private extractPreparationTips(searchResults: any, company: string, role?: string): string[] {
    return [
      `Research ${company}'s values and mission`,
      `Review the ${role || 'role'} job description`,
      'Use STAR examples',
      'Practice common interview questions',
      'Prepare thoughtful questions for the interviewer',
      'Review your resume thoroughly',
      'Research interviewer backgrounds if available',
      'Plan logistics ahead of time',
      'Practice elevator pitch',
    ];
  }

  private extractTimeline(searchResults: any, company: string): any {
    return {
      estimated_duration: '2-4 weeks',
      stages: [
        { stage: 'Application Review', duration: '1-3 days' },
        { stage: 'Initial Screening', duration: '3-5 days' },
        { stage: 'Technical Assessment', duration: '1 week' },
        { stage: 'Final Interviews', duration: '1-2 weeks' },
        { stage: 'Decision & Offer', duration: '3-7 days' },
      ],
    };
  }

  private capitalizeStage(stage: string): string {
    return stage.charAt(0).toUpperCase() + stage.slice(1) + ' Phase';
  }

  private extractSuccessTips(searchResults: any, company: string): string[] {
    return [
      `Show enthusiasm for ${company}'s mission`,
      'Use quantifiable achievements',
      'Ask thoughtful questions',
      'Show cultural fit',
      'Practice active listening',
      'Follow up within 24 hours',
    ];
  }
}
