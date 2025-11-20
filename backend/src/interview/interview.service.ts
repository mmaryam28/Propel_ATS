import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class InterviewService {
  private readonly serpApiKey = process.env.SERP_API_KEY;

  /**
   * UC-068 AC1: Research typical interview process and stages
   */
  async getInterviewProcess(company: string): Promise<any> {
    if (!this.serpApiKey) {
      return { error: 'SERP API key not configured' };
    }

    try {
      // Use multiple search queries for better results
      const queries = [
        `"${company}" interview process stages rounds glassdoor`,
        `${company} hiring process steps interview rounds`,
        `${company} interview experience process reddit blind`,
        `${company} technical interview process onsite virtual`
      ];
      
      let allStages: any[] = [];
      let searchData: any = {};
      
      // Search with multiple queries
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
      
      // Remove duplicates and use best stages found
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
      // Use multiple search queries to get better results
      const queries = [
        `"${company}"${roleQuery} interview questions commonly asked`,
        `${company} interview questions experience glassdoor`,
        `${company}${roleQuery} interview what to expect questions`,
        `${company} hiring process interview questions reddit`
      ];
      
      let allQuestions: string[] = [];
      
      // Search with multiple queries to get comprehensive results
      for (const query of queries.slice(0, 2)) { // Limit to 2 queries to avoid rate limits
        const searchResults = await this.searchWithSerpApi(query);
        const questions = this.extractQuestions(searchResults, company, role);
        allQuestions.push(...questions);
      }
      
      // Remove duplicates and limit results
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
      
      // Search with multiple queries
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
      const [process, questions, interviewers, formats, recommendations, timeline, successTips] = await Promise.all([
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

  // Private helper methods
  private async searchWithSerpApi(query: string): Promise<any> {
    try {
      const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${this.serpApiKey}&num=10&gl=us&hl=en`;
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
          ...(result.sitelinks?.map((link: any) => link.title + ' ' + (link.snippet || '')) || [])
        ];

        for (const text of textSources) {
          if (!text) continue;
          
          // Look for common interview stage patterns
          const stagePatterns = [
            /(\d+)\s*(step|stage|round|phase)\s*:?\s*([^.\n]+)/gi,
            /(phone|video|technical|onsite|panel|final|behavioral|coding|system design|cultural fit)\s*(interview|assessment|screening|round)\s*:?\s*([^.\n]*)/gi,
            /(first|second|third|initial|final)\s*(interview|round|stage)\s*:?\s*([^.\n]*)/gi
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
                duration
              });
            }
          }
          
          // Look for duration information
          const durationMatches = text.match(/(\d+)\s*(week|day|hour|minute)s?/gi);
          if (durationMatches && extractedStages.length > 0) {
            // Try to associate durations with stages
          }
        }
      }
    }

    return extractedStages.slice(0, 6); // Limit to reasonable number of stages
  }
  
  private deduplicateStages(stages: any[]): any[] {
    const seen = new Set();
    return stages.filter(stage => {
      const key = stage.stage.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  private getDefaultStages(company: string): any[] {
    return [
      {
        stage: 'Application Review',
        description: `${company} reviews your application and resume`,
        duration: '1-3 days'
      },
      {
        stage: 'Phone/Video Screening',
        description: 'Initial conversation with recruiter or hiring manager',
        duration: '30-45 minutes'
      },
      {
        stage: 'Technical Assessment',
        description: 'Skills evaluation, coding challenge, or technical interview',
        duration: '1-3 hours'
      },
      {
        stage: 'Onsite/Virtual Interviews',
        description: 'Multiple rounds with team members and managers',
        duration: '3-5 hours'
      },
      {
        stage: 'Final Review',
        description: 'Decision making and reference checks',
        duration: '3-7 days'
      }
    ];
  }
  
  private cleanStageName(name: string): string {
    return name.replace(/^\d+\s*(step|stage|round|phase)\s*:?\s*/i, '')
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
      return 'Technical evaluation of your programming and problem-solving skills';
    } else if (name.includes('onsite') || name.includes('panel')) {
      return 'In-person or virtual interviews with multiple team members';
    } else if (name.includes('behavioral') || name.includes('cultural')) {
      return 'Assessment of your soft skills and cultural fit with the team';
    } else if (name.includes('final') || name.includes('last')) {
      return 'Final interview with senior leadership or decision makers';
    }
    return `Interview stage focused on evaluating your fit for the role at ${company}`;
  }
  
  private estimateStageDuration(stageName: string): string {
    const name = stageName.toLowerCase();
    if (name.includes('phone') || name.includes('screening')) {
      return '30-45 minutes';
    } else if (name.includes('technical') || name.includes('coding')) {
      return '1-2 hours';
    } else if (name.includes('onsite') || name.includes('panel')) {
      return '3-5 hours';
    } else if (name.includes('final')) {
      return '1 hour';
    }
    return '1-2 hours';
  }

  private extractQuestions(searchResults: any, company: string, role?: string): string[] {
    const extractedQuestions: string[] = [];
    
    // Try to extract company-specific questions from search results
    if (searchResults?.organic_results) {
      for (const result of searchResults.organic_results.slice(0, 5)) {
        // Look for questions in snippets, titles, and rich snippets
        const textSources = [
          result.snippet || '',
          result.title || '',
          result.rich_snippet?.top?.extensions?.join(' ') || '',
          ...(result.sitelinks?.map(link => link.title + ' ' + (link.snippet || '')) || [])
        ];

        for (const text of textSources) {
          if (!text) continue;
          
          // Enhanced question pattern matching
          const questionPatterns = [
            // Direct questions
            /(?:^|\.|!|\?|\n)\s*([^.!?]*(?:why|what|how|when|where|who|describe|tell me|explain|walk me through)[^.!?]*\?)/gi,
            // Interview-specific patterns
            /(?:question|ask|asked|interview)\s*[:.]?\s*([^.!?]*\?)/gi,
            // Common interview question starters
            /(tell me about yourself|why do you want to work|what are your|how do you handle|describe a time|walk me through|what interests you|why are you leaving)[^.!?]*\??/gi
          ];

          for (const pattern of questionPatterns) {
            const matches = text.match(pattern);
            if (matches) {
              for (let match of matches) {
                match = match.trim().replace(/^(question|ask|asked|interview)\s*[:.]?\s*/i, '');
                if (match.length > 10 && match.length < 200) {
                  // Ensure it ends with a question mark
                  if (!match.endsWith('?')) {
                    match += '?';
                  }
                  
                  // Clean up the question
                  match = match.charAt(0).toUpperCase() + match.slice(1);
                  
                  // Avoid duplicates
                  if (!extractedQuestions.some(q => q.toLowerCase().includes(match.toLowerCase().substring(0, 20)))) {
                    extractedQuestions.push(match);
                  }
                }
              }
            }
          }
        }
      }
    }

    // If we found company-specific questions, return them
    if (extractedQuestions.length > 0) {
      // Sort by relevance (prefer questions mentioning the company)
      extractedQuestions.sort((a, b) => {
        const aHasCompany = a.toLowerCase().includes(company.toLowerCase()) ? 1 : 0;
        const bHasCompany = b.toLowerCase().includes(company.toLowerCase()) ? 1 : 0;
        return bHasCompany - aHasCompany;
      });
      
      return extractedQuestions.slice(0, 15); // Return top 15 questions
    }

    // Enhanced fallback questions with company-specific customization
    const defaultQuestions = [
      `Why do you want to work at ${company}?`,
      `What do you know about ${company} and our mission?`,
      `How does your experience align with ${company}'s values?`,
      'Tell me about yourself and your background',
      'What interests you most about this role?',
      'Describe your greatest professional achievement',
      'What are your biggest strengths and areas for improvement?',
      'How do you handle pressure and tight deadlines?',
      'Describe a challenging project you worked on and how you overcame obstacles',
      'Where do you see yourself in 5 years?',
      'Why are you leaving your current position?',
      'How do you stay current with industry trends?',
      'Describe a time when you had to work with a difficult team member',
      'What motivates you in your work?',
      `How would you contribute to ${company}'s growth and success?`
    ];

    // Add role-specific questions if role is provided
    if (role) {
      const roleSpecificQuestions = [
        `What specific skills do you bring to this ${role} position?`,
        `Describe your experience with the key responsibilities of a ${role}`,
        `What challenges do you anticipate in this ${role} and how would you address them?`,
        `How do you see the ${role} function evolving in the next few years?`
      ];
      defaultQuestions.splice(5, 0, ...roleSpecificQuestions);
    }

    return defaultQuestions.slice(0, 15);
  }

  private extractInterviewerInfo(searchResults: any, company: string): any[] {
    const defaultInterviewers = [
      {
        role: 'HR Representative',
        background: 'Handles initial screening and cultural fit assessment',
        tips: 'Focus on your soft skills and company culture alignment'
      },
      {
        role: 'Hiring Manager',
        background: 'Direct supervisor for the role, technical expertise',
        tips: 'Demonstrate relevant experience and problem-solving abilities'
      },
      {
        role: 'Team Lead',
        background: 'Senior team member who will assess technical skills',
        tips: 'Show how you collaborate and contribute to team success'
      },
      {
        role: 'Senior Leadership',
        background: 'Executive level, focuses on strategic thinking',
        tips: 'Discuss your vision and how you can drive company goals'
      }
    ];

    return defaultInterviewers;
  }

  private extractInterviewFormats(searchResults: any, company: string): any[] {
    const defaultFormats = [
      {
        type: 'Phone/Video Call',
        description: 'Initial screening conversation',
        duration: '30-45 minutes',
        tips: 'Test your technology beforehand and have a quiet environment'
      },
      {
        type: 'Panel Interview',
        description: 'Meeting with multiple team members simultaneously',
        duration: '1-2 hours',
        tips: 'Make eye contact with all panelists and address each person'
      },
      {
        type: 'Technical Interview',
        description: 'Skills assessment or coding challenge',
        duration: '1-3 hours',
        tips: 'Practice relevant technical skills and think out loud'
      },
      {
        type: 'Behavioral Interview',
        description: 'Questions about past experiences and soft skills',
        duration: '45-60 minutes',
        tips: 'Use the STAR method to structure your responses'
      },
      {
        type: 'Case Study',
        description: 'Problem-solving exercise or real-world scenario',
        duration: '2-3 hours',
        tips: 'Ask clarifying questions and explain your thought process'
      }
    ];

    return defaultFormats;
  }

  private extractPreparationTips(searchResults: any, company: string, role?: string): string[] {
    const defaultTips = [
      `Research ${company}'s mission, values, and recent developments`,
      `Review the ${role || 'position'} requirements thoroughly`,
      'Prepare specific examples using the STAR method',
      'Practice common interview questions out loud',
      'Prepare thoughtful questions about the role and company',
      'Review your resume and be ready to discuss any point',
      'Research the interview panel if names are provided',
      'Plan your outfit and route to the interview location',
      'Bring multiple copies of your resume and portfolio',
      'Practice your elevator pitch and key talking points'
    ];

    return defaultTips;
  }

  private extractTimeline(searchResults: any, company: string): any {
    let estimatedDuration = '2-4 weeks';
    const extractedStages: any[] = [];
    
    if (searchResults?.organic_results) {
      for (const result of searchResults.organic_results.slice(0, 5)) {
        const textSources = [
          result.snippet || '',
          result.title || ''
        ];

        for (const text of textSources) {
          if (!text) continue;
          
          // Look for timeline duration patterns
          const durationPatterns = [
            /(\d+)\s*[-to]*\s*(\d+)?\s*(week|day|month)s?/gi,
            /(take|takes|lasted|duration|process)\s+[^.]*?(\d+)\s*[-to]*\s*(\d+)?\s*(week|day|month)s?/gi,
            /(\d+)\s*(week|day|month)s?\s+[^.]*?(process|interview|hiring)/gi
          ];

          for (const pattern of durationPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
              const num1 = parseInt(match[1] || match[2]);
              const num2 = match[2] ? parseInt(match[2]) : null;
              const unit = match[3] || match[4];
              
              if (unit === 'week' || unit === 'weeks') {
                if (num2) {
                  estimatedDuration = `${num1}-${num2} weeks`;
                } else if (num1) {
                  estimatedDuration = `${num1} weeks`;
                }
              } else if (unit === 'day' || unit === 'days') {
                if (num1 > 7) {
                  const weeks = Math.ceil(num1 / 7);
                  estimatedDuration = `${weeks} weeks`;
                }
              }
            }
          }
          
          // Look for stage-specific timelines
          const stageTimelinePattern = /(application|screening|technical|interview|onsite|final)\s*[^.]*?(\d+)\s*[-to]*\s*(\d+)?\s*(day|week|hour)s?/gi;
          const stageMatches = text.matchAll(stageTimelinePattern);
          for (const match of stageMatches) {
            const stage = match[1];
            const duration = match[3] ? `${match[2]}-${match[3]} ${match[4]}s` : `${match[2]} ${match[4]}s`;
            extractedStages.push({ stage: this.capitalizeStage(stage), duration });
          }
        }
      }
    }

    // Use extracted stages or fall back to defaults
    const stages = extractedStages.length > 0 ? extractedStages : [
      { stage: 'Application Review', duration: '1-3 days' },
      { stage: 'Initial Screening', duration: '3-5 days' },
      { stage: 'Technical Assessment', duration: '1 week' },
      { stage: 'Final Interviews', duration: '1-2 weeks' },
      { stage: 'Decision & Offer', duration: '3-7 days' }
    ];

    return {
      estimated_duration: estimatedDuration,
      stages: stages.slice(0, 6)
    };
  }
  
  private capitalizeStage(stage: string): string {
    return stage.charAt(0).toUpperCase() + stage.slice(1) + ' Phase';
  }

  private extractSuccessTips(searchResults: any, company: string): string[] {
    const defaultTips = [
      `Show genuine enthusiasm for ${company}'s mission and products`,
      'Be specific about your achievements with quantifiable results',
      'Ask insightful questions that show you\'ve done your research',
      'Demonstrate how you can add value to their team',
      'Be honest about your experience and areas for growth',
      'Show your problem-solving process, not just the solution',
      'Follow up with a thank-you email within 24 hours',
      'Be prepared to discuss how you handle failure and learning',
      'Show cultural fit by aligning with company values',
      'Practice active listening and engage in conversation'
    ];

    return defaultTips;
  }
}