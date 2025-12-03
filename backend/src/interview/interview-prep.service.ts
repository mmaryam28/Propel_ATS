import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import fetch from 'node-fetch';

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

// ---- Ollama config ----
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// You have LITELLM_MODEL in your .env, but you're using phi3.
// This logic supports either plain "phi3" or "ollama/phi3" style values.
const rawModel = process.env.LITELLM_MODEL || 'phi3';
const OLLAMA_MODEL = rawModel.startsWith('ollama/')
  ? rawModel.split('/')[1]
  : rawModel;

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
      console.error('[InterviewPrepService] Interview lookup error:', interviewError);
      throw new Error('Interview not found for this user');
    }

    const companyName: string =
      interview.company_name ||
      interview.company_type ||
      'the company';

    const roleTitle: string =
      interview.job_title ||
      interview.title ||
      'this role';

    // 2) Check if prep already exists
    const { data: prepRows, error: prepError } = await client
      .from('interview_ai_data')
      .select('*')
      .eq('interview_id', interviewId)
      .limit(1);

    if (prepError) {
      console.error('[InterviewPrepService] Error loading interview prep:', prepError);
      throw new Error('Failed to load interview prep');
    }

    if (prepRows && prepRows.length > 0) {
      return this.mapRowToPrep(prepRows[0]);
    }

    // 3) No prep yet → ask Ollama / phi3 to generate it
    let payload: InterviewPrepData;

    const aiPayload = await this.generatePrepWithOllama(companyName, roleTitle);

    if (aiPayload) {
      payload = aiPayload;
    } else {
      // Fallback: deterministic template if Ollama fails
      payload = this.buildPrepPayload(companyName, roleTitle);
    }

    // 4) Store in Supabase
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
      console.error('[InterviewPrepService] Error creating interview prep row:', insertError);
      throw new Error('Failed to create interview prep');
    }

    return this.mapRowToPrep(inserted);
  }

  // ---------------- AI CALL TO OLLAMA / PHI3 ----------------

  private async generatePrepWithOllama(
    companyName: string,
    roleTitle: string,
  ): Promise<InterviewPrepData | null> {
    try {
      const prompt = `
You are helping a candidate prepare for an interview.

Company: "${companyName}"
Role: "${roleTitle}"

Generate a complete interview preparation package in STRICT JSON with NO extra text.
Do NOT include any markdown, backticks, or explanations. Only return valid JSON.

The JSON must match this TypeScript shape exactly:

{
  "companyResearch": string,
  "questionBank": {
    "behavioral": string[],
    "technical": string[],
    "situational": string[],
    "companySpecific": string[]
  },
  "mockInterview": {
    "intro": string,
    "questions": { "id": string, "type": string, "text": string }[],
    "summary": string
  },
  "technicalPrep": {
    "overview": string,
    "codingChallenge": {
      "prompt": string,
      "hint": string,
      "solutionOutline": string
    },
    "systemDesign": {
      "prompt": string,
      "keyPoints": string[]
    }
  },
  "checklist": {
    "items": { "id": string, "label": string, "category": string, "suggestedTime"?: string }[]
  }
}

Details:

- "companyResearch" should be a multi-paragraph string summarizing the company, what to research, and how this role connects to impact.
- "questionBank.behavioral" should contain at least 3 STAR-style questions.
- "questionBank.technical" should include questions relevant to the role title.
- "questionBank.companySpecific" should include questions that mention the company name.
- "mockInterview.questions" should have 5–8 questions mixing behavioral, technical, situational, and companySpecific.
- "technicalPrep.codingChallenge" should be a realistic coding problem with explanation.
- "technicalPrep.systemDesign" should be a system design style prompt and 3–6 key points.
- "checklist.items" should contain at least 6 items across categories like "Logistics", "Company", "Role", "Content".
`;

      console.log('[InterviewPrepService] Calling Ollama at', `${OLLAMA_URL}/api/generate`, 'model:', OLLAMA_MODEL);

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[InterviewPrepService] Ollama HTTP error:', response.status, text);
        return null;
      }

      const body = await response.json();
      // Ollama non-stream response field is `response`
      let raw = (body && body.response) ? String(body.response) : '';

      if (!raw) {
        console.error('[InterviewPrepService] Ollama returned empty response');
        return null;
      }

      // In case the model tries to wrap it in ```json ... ```
      raw = raw.trim();
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
      }

      // Try to parse JSON robustly. Model outputs sometimes include
      // extra text, code fences, or minor formatting issues. Attempt
      // to extract the first balanced JSON object from the response
      // and parse that. If that fails, fall back to a plain JSON.parse.
      let parsed: any;

      const tryExtractJson = (s: string): any | null => {
        const start = s.indexOf('{');
        if (start === -1) return null;
        let depth = 0;
        for (let i = start; i < s.length; i++) {
          const ch = s[i];
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
          if (depth === 0) {
            const candidate = s.slice(start, i + 1);
            try {
              return JSON.parse(candidate);
            } catch (e) {
              // continue searching if parse fails for this candidate
              break;
            }
          }
        }
        return null;
      };

      try {
        parsed = tryExtractJson(raw);
        if (!parsed) {
          // Final attempt: plain parse (for well-formed responses)
          parsed = JSON.parse(raw);
        }
      } catch (err) {
        console.error('[InterviewPrepService] Failed to parse Ollama JSON:', err, 'raw:', raw.slice(0, 1000));
        return null;
      }

      // Minimal sanity checks
      if (!parsed.companyResearch || !parsed.questionBank || !parsed.mockInterview) {
        console.error('[InterviewPrepService] Parsed JSON missing required fields');
        return null;
      }

      const result: InterviewPrepData = {
        companyResearch: String(parsed.companyResearch),
        questionBank: {
          behavioral: parsed.questionBank.behavioral ?? [],
          technical: parsed.questionBank.technical ?? [],
          situational: parsed.questionBank.situational ?? [],
          companySpecific: parsed.questionBank.companySpecific ?? [],
        },
        mockInterview: {
          intro: parsed.mockInterview.intro ?? '',
          questions: Array.isArray(parsed.mockInterview.questions)
            ? parsed.mockInterview.questions.map((q: any, idx: number) => ({
                id: q.id ?? `q${idx + 1}`,
                type: q.type ?? 'behavioral',
                text: q.text ?? '',
              }))
            : [],
          summary: parsed.mockInterview.summary ?? '',
        },
        technicalPrep: {
          overview: parsed.technicalPrep?.overview ?? '',
          codingChallenge: {
            prompt: parsed.technicalPrep?.codingChallenge?.prompt ?? '',
            hint: parsed.technicalPrep?.codingChallenge?.hint ?? '',
            solutionOutline: parsed.technicalPrep?.codingChallenge?.solutionOutline ?? '',
          },
          systemDesign: {
            prompt: parsed.technicalPrep?.systemDesign?.prompt ?? '',
            keyPoints: parsed.technicalPrep?.systemDesign?.keyPoints ?? [],
          },
        },
        checklist: {
          items: Array.isArray(parsed.checklist?.items)
            ? parsed.checklist.items.map((item: any, idx: number) => ({
                id: item.id ?? `item-${idx + 1}`,
                label: item.label ?? '',
                category: item.category ?? 'General',
                suggestedTime: item.suggestedTime,
              }))
            : [],
        },
      };

      return result;
    } catch (err) {
      console.error('[InterviewPrepService] Error calling Ollama:', err);
      return null;
    }
  }

  // --------------- MAPPERS & FALLBACK TEMPLATE ----------------

  private mapRowToPrep(row: any): InterviewPrepData {
    return {
      companyResearch: row.company_research,
      questionBank: row.question_bank,
      mockInterview: row.mock_interview_script,
      technicalPrep: row.technical_prep,
      checklist: row.checklist,
    };
  }

  // Fallback deterministic generator if Ollama is unavailable or parsing fails
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
      summary:
        'After practicing with these questions, review your answers and adjust them to be more specific, concise, and measurable.',
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
