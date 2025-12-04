import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import fetch from 'node-fetch';
import { jsonrepair } from 'jsonrepair';

// ------------ Types ------------
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

// ------------ Ollama config ------------
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const rawModel = process.env.LITELLM_MODEL || 'phi3';
const OLLAMA_MODEL = rawModel.replace('ollama/', '');

@Injectable()
export class InterviewPrepService {
  constructor(private readonly supabase: SupabaseService) {}

  // ---------------- Public API -----------------

  async getOrCreatePrep(userId: string, interviewId: string): Promise<InterviewPrepData> {
    return this.generateAllSections(userId, interviewId);
  }

  async generateAndUpsertSection(userId: string, interviewId: string, section: string) {
    const ctx = await this.getInterviewContext(userId, interviewId);
    const { companyName, roleTitle } = ctx;

    switch (section) {
      case 'company_research':
        return { section, data: { companyResearch: await this.generateCompanyResearch(companyName, roleTitle) } };

      case 'question_bank':
        return { section, data: { questionBank: await this.generateQuestionBank(companyName, roleTitle) } };

      case 'mock_interview':
        return { section, data: { mockInterview: await this.generateMockInterview(companyName, roleTitle) } };

      case 'technical_prep':
        return { section, data: { technicalPrep: await this.generateTechnicalPrep(companyName, roleTitle) } };

      case 'checklist':
        return { section, data: { checklist: await this.generateChecklist(companyName, roleTitle) } };

      default:
        return await this.generateAllSections(userId, interviewId);
    }
  }

  async generateAllSections(userId: string, interviewId: string): Promise<InterviewPrepData> {
    const ctx = await this.getInterviewContext(userId, interviewId);
    const { companyName, roleTitle } = ctx;

    return {
      companyResearch: await this.generateCompanyResearch(companyName, roleTitle),
      questionBank: await this.generateQuestionBank(companyName, roleTitle),
      mockInterview: await this.generateMockInterview(companyName, roleTitle),
      technicalPrep: await this.generateTechnicalPrep(companyName, roleTitle),
      checklist: await this.generateChecklist(companyName, roleTitle),
    };
  }

  // ---------------- Interview Context -----------------

  private async getInterviewContext(userId: string, interviewId: string) {
    const client = this.supabase.getClient();

    const { data: interview } = await client
      .from('interviews')
      .select('id,user_id,company_name,company_type,job_title,title,job_id')
      .eq('id', interviewId)
      .single();

    if (!interview) throw new Error('Interview not found');
    if (interview.user_id !== userId) throw new Error('Unauthorized');

    let companyName = interview.company_name || interview.company_type || null;
    let roleTitle = interview.job_title || interview.title || null;

    if (interview.job_id) {
      const { data: job } = await client
        .from('jobs')
        .select('company,title')
        .eq('id', interview.job_id)
        .single();

      if (job) {
        if (!companyName) companyName = job.company;
        if (!roleTitle) roleTitle = job.title;
      }
    }

    return {
      companyName: companyName || 'the company',
      roleTitle: roleTitle || 'this role',
    };
  }

  // ---------------- Section Generators -----------------

  private async generateCompanyResearch(companyName: string, roleTitle: string): Promise<string> {
    const prompt = `
Write a structured **markdown** company research summary.

Format:

# Company Overview
2–4 sentences

# Mission & Values
- bullet list

# Products & Services
- bullets

# Competitive Landscape
Short paragraph.

# Recent News
- Month Year — description

# Talking Points
- bullets

# Good Questions to Ask
- bullets

Company: "${companyName}"
Role: "${roleTitle}"

Return ONLY markdown. No JSON.
`;

    return await this.callOllamaText(prompt);
  }

  private async generateQuestionBank(company: string, role: string): Promise<QuestionBank> {
    const prompt = `
Return ONLY JSON:

{
  "behavioral": [],
  "technical": [],
  "situational": [],
  "companySpecific": []
}

Company: "${company}"
Role: "${role}"
`;

    return await this.callOllamaJson<QuestionBank>(prompt);
  }

  private async generateMockInterview(company: string, role: string): Promise<MockInterview> {
    const prompt = `You are a JSON generator. Return ONLY a valid JSON object. Do not include any text before or after the JSON. Do not include comments or markdown formatting.

{
  "intro": "string",
  "questions": [
    { "id": "q1", "type": "behavioral", "text": "string" }
  ],
  "summary": "string"
}

Company: "${company}"
Role: "${role}"

Requirements:
- Return ONLY the JSON object. Nothing else.
- Ensure all quotes are properly closed.
- Do not include any explanatory text.`;

    return await this.callOllamaJsonWithRetry<MockInterview>(prompt);
  }

  private async generateTechnicalPrep(company: string, role: string): Promise<TechnicalPrep> {
    const prompt = `
Return ONLY JSON:

{
  "overview": "",
  "codingChallenge": {
    "prompt": "",
    "hint": "",
    "solutionOutline": ""
  },
  "systemDesign": {
    "prompt": "",
    "keyPoints": []
  }
}

Company: "${company}"
Role: "${role}"
`;

    return await this.callOllamaJson<TechnicalPrep>(prompt);
  }

  private async generateChecklist(company: string, role: string): Promise<Checklist> {
    const prompt = `
Return ONLY JSON:

{
  "items": [
    { "id": "1", "label": "", "category": "", "suggestedTime": "" }
  ]
}

Company: "${company}"
Role: "${role}"
`;

    return await this.callOllamaJson<Checklist>(prompt);
  }

  // ---------------- Ollama Helpers -----------------

  private async callOllamaText(prompt: string): Promise<string> {
    const res = await this.basicOllamaCall(prompt);
    let text = res.trim();

    if (text.startsWith("```")) {
      text = text.replace(/```[a-zA-Z]*\s*/, "").replace(/```/, "").trim();
    }

    return text;
  }

  private async callOllamaJson<T>(prompt: string): Promise<T> {
    const res = await this.basicOllamaCall(prompt);

    try {
      return this.extractJson(res) as T;
    } catch (err) {
      console.error("⚠️ JSON extraction failed. Raw LLM output:\n", res);
      throw err;
    }
  }

  // Retry wrapper specialized for stubborn sections like mock interview
  private async callOllamaJsonWithRetry<T>(prompt: string, attempts = 2, delayMs = 1000): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.callOllamaJson<T>(prompt);
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    throw lastErr;
  }

  private async basicOllamaCall(prompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    });

    const wrapper = await response.json();
    return wrapper.response || '';
  }

  // ---------------- Auto-Fixing JSON Extractor -----------------

  private extractJson(rawText: string): any {
    if (!rawText) throw new Error("Empty AI response");

    // 1) Strip code fences and leading chatter (e.g., "Here's your JSON:")
    let text = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()
      .replace(/^[^({\[]+/g, "")
      .trim();

    // 2) Find the first JSON-looking structure and slice from there
    const firstObject = text.indexOf("{");
    const firstArray = text.indexOf("[");
    const firstToken = [firstObject, firstArray]
      .filter((i) => i !== -1)
      .sort((a, b) => a - b)[0];

    if (firstToken === -1 || firstToken === undefined) {
      throw new Error("No JSON found");
    }

    let candidate = text.slice(firstToken);

    // 3) Use jsonrepair first — it fixes trailing commas, single quotes,
    // unquoted keys, comments, and some structural issues.
    try {
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    } catch {}

    // 4) Direct parse fallback
    try {
      return JSON.parse(candidate);
    } catch {}

    // 5) Progressive truncation fallback: try parsing progressively shorter slices
    for (let end = candidate.length; end > 0; end--) {
      const slice = candidate.slice(0, end);
      try {
        return JSON.parse(slice);
      } catch {}
    }

    // 6) If all else fails, raise with preview to aid debugging
    throw new Error("Failed to extract JSON. Candidate preview: " + candidate.slice(0, 2000));
  }
}
