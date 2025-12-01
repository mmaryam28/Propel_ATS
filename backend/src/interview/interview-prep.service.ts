import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type QuestionBank = {
  behavioral: string[];
  technical: string[];
  situational: string[];
  companySpecific: string[];
};

export type MockInterview = {
  intro: string;
  questions: { id: string; type: string; text: string }[];
  summary: string;
};

export type TechnicalPrep = {
  overview: string;
  codingChallenge: {
    prompt: string;
    hint: string;
    solutionOutline: string;
  };
  systemDesign: {
    prompt: string;
    keyPoints: string[];
  };
};

export type Checklist = {
  items: { id: string; label: string; category: string; suggestedTime?: string }[];
};

export type InterviewPrepData = {
  companyResearch: string;
  questionBank: QuestionBank;
  mockInterview: MockInterview;
  technicalPrep: TechnicalPrep;
  checklist: Checklist;
};

@Injectable()
export class InterviewPrepService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOrCreatePrep(userId: string, interviewId: string): Promise<InterviewPrepData> {
    const client = this.supabase.getClient();

    // 1) Make sure interview belongs to this user
    const { data: interview, error: interviewError } = await client
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (interviewError || !interview) {
      throw new Error('Interview not found for this user');
    }

    const companyName: string = interview.company_name || interview.company_type || 'the company';
    const roleTitle: string = interview.job_title || interview.title || 'this role';

    // 2) Check if prep already exists
    const { data: prepRows, error: prepError } = await client
      .from('interview_ai_data')
      .select('*')
      .eq('interview_id', interviewId)
      .limit(1);

    if (prepError) {
      console.error('Error loading interview prep:', prepError);
      throw new Error('Failed to load interview prep');
    }

    if (prepRows && prepRows.length > 0) {
      return this.mapRowToPrep(prepRows[0]);
    }

    // 3) No prep yet, build it now
    const payload = this.buildPrepPayload(companyName, roleTitle);

    const { data: inserted, error: insertError } = await client
      .from('interview_ai_data')
      .insert({
        interview_id: interviewId,
        company_research: payload.companyResearch,
        question_bank: payload.questionBank,
        mock_interview_script: payload.mockInterview,
        technical_prep: payload.technicalPrep,
        checklist: payload.checklist,
      })
      .select('*')
      .single();

    if (insertError || !inserted) {
      console.error('Error creating interview prep row:', insertError);
      throw new Error('Failed to create interview prep');
    }

    return this.mapRowToPrep(inserted);
  }

  private mapRowToPrep(row: any): InterviewPrepData {
    return {
      companyResearch: row.company_research,
      questionBank: row.question_bank,
      mockInterview: row.mock_interview_script,
      technicalPrep: row.technical_prep,
      checklist: row.checklist,
    };
  }

  // For now this is a smart template generator.
  // Later you can replace inside here with real LLM calls.
  private buildPrepPayload(companyName: string, roleTitle: string): InterviewPrepData {
    const companyResearch = [
      `## Company overview`,
      ``,
      `${companyName} is a company where you should be ready to talk about its mission, core products, and recent milestones.`,
      ``,
      `### What to know before the interview`,
      `- Mission and values for ${companyName}`,
      `- Key products and services`,
      `- Recent news such as launches, acquisitions, or funding`,
      `- How the ${roleTitle} role connects to business impact`,
      ``,
      `### Talking points you can use`,
      `- Why you like ${companyName}'s mission`,
      `- How your experience aligns with their current priorities`,
      `- A recent initiative or project at ${companyName} that you find interesting`,
    ].join('\n');

    const questionBank: QuestionBank = {
      behavioral: [
        'Tell me about a time you had to learn something quickly for a project.',
        'Describe a situation where you disagreed with a teammate. What did you do?',
        'Tell me about a time you failed at something and what you learned.',
      ],
      technical: [
        `Walk me through a technical project that best shows your fit for ${roleTitle}.`,
        'Explain a system you have designed end to end. What tradeoffs did you make?',
        'Tell me about a time you debugged a particularly tricky issue.',
      ],
      situational: [
        'If you joined and realized the team had no documentation, what would you do?',
        'If you are given two urgent tasks with the same deadline, how do you prioritize?',
      ],
      companySpecific: [
        `Why do you want to work at ${companyName}?`,
        `What do you think is the biggest challenge ${companyName} is facing right now?`,
        `How do you see the ${roleTitle} role supporting the goals of ${companyName}?`,
      ],
    };

    const mockInterview: MockInterview = {
      intro: `This mock interview simulates a real conversation for a ${roleTitle} role at ${companyName}. Use it to practice concise and structured answers.`,
      questions: [
        { id: 'q1', type: 'behavioral', text: 'Tell me about yourself and what brings you to this opportunity.' },
        { id: 'q2', type: 'behavioral', text: 'Describe a time you had to deliver under a tight deadline.' },
        { id: 'q3', type: 'technical', text: 'Walk me through a recent technical project you are proud of.' },
        { id: 'q4', type: 'situational', text: 'If you joined the team and saw something broken in the process, what would you do?' },
        { id: 'q5', type: 'companySpecific', text: `What excites you most about ${companyName} and this ${roleTitle} role?` },
      ],
      summary: 'After practicing with these questions, review your answers and adjust them to be more specific, concise, and measurable.',
    };

    const technicalPrep: TechnicalPrep = {
      overview: `Focus on clearly explaining your reasoning, communication, and tradeoffs for the ${roleTitle} role.`,
      codingChallenge: {
        prompt:
          'Given an array of integers, return the length of the longest strictly increasing subsequence. Explain your approach and complexity.',
        hint:
          'Try to think in terms of dynamic programming and how you can reuse earlier results instead of recomputing from scratch.',
        solutionOutline:
          'You can use a dynamic programming array where dp[i] is the length of the longest increasing subsequence ending at i, or use a patience sorting trick with a tails array. Emphasize clear reasoning over just the final code.',
      },
      systemDesign: {
        prompt:
          'Design a simple system that lets users track their job applications and interviews. Talk about the main entities, APIs, and data flows.',
        keyPoints: [
          'Identify core entities such as users, jobs, applications, interviews.',
          'Discuss API endpoints for creating and updating those entities.',
          'Cover storage choices, indexing for queries, and basic security considerations.',
          'Explain how you would extend the system for analytics later.',
        ],
      },
    };

    const checklist: Checklist = {
      items: [
        {
          id: 'logistics-1',
          label: 'Confirm interview time, time zone, and meeting link or address.',
          category: 'Logistics',
          suggestedTime: '24 hours before',
        },
        {
          id: 'logistics-2',
          label: 'Test audio, video, and screen sharing if the interview is virtual.',
          category: 'Logistics',
          suggestedTime: '2 hours before',
        },
        {
          id: 'company-1',
          label: `Review ${companyName} mission, values, and recent news.`,
          category: 'Company',
          suggestedTime: '1 day before',
        },
        {
          id: 'role-1',
          label: `Read the ${roleTitle} job description and pick 3 projects that match best.`,
          category: 'Role',
          suggestedTime: '1 day before',
        },
        {
          id: 'tech-1',
          label: 'Practice at least 2 behavioral stories using the STAR method.',
          category: 'Content',
          suggestedTime: 'Day of interview',
        },
        {
          id: 'questions-1',
          label: 'Prepare 3 to 5 thoughtful questions for the interviewer.',
          category: 'Content',
          suggestedTime: 'Day of interview',
        },
      ],
    };

    return {
      companyResearch,
      questionBank,
      mockInterview,
      technicalPrep,
      checklist,
    };
  }
}
