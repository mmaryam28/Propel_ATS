import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import fetch from 'node-fetch';

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
    const prompt = `
Return ONLY JSON:

{
  "intro": "",
  "questions": [
    { "id": "q1", "type": "behavioral", "text": "" }
  ],
  "summary": ""
}

Company: "${company}"
Role: "${role}"
`;

    return await this.callOllamaJson<MockInterview>(prompt);
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

    // remove fences
    let text = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // remove leading junk like "Here's your JSON:"
    text = text.replace(/^[^({\[]+/g, "").trim();

    const firstBrace = text.indexOf("{");
    if (firstBrace === -1) throw new Error("No JSON found");

    let candidate = text.slice(firstBrace);

    // 1. remove trailing commas
    candidate = candidate.replace(/,\s*([}\]])/g, "$1");

    // 2. escape apostrophes in strings to avoid breaking JSON (e.g., "you've" → "you\'ve")
    // Don't blindly convert apostrophes to double quotes; that breaks strings like "you've"
    candidate = candidate.replace(/([^\\])'/g, "$1\\'");

    // 3. remove comments
    candidate = candidate.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

    // 4. ensure keys are quoted
    // Only quote unquoted keys (keys following { or ,). This avoids double-quoting keys
    // that are already properly quoted which would produce invalid JSON.
    candidate = candidate.replace(/([\{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');

    // 5. fix brace imbalance
    const open = (candidate.match(/{/g) || []).length;
    const close = (candidate.match(/}/g) || []).length;
    if (open > close) {
      candidate += "}".repeat(open - close);
    }

    // try full parse
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // fall through to partial attempts
    }

    // try partial until valid
    for (let end = candidate.length; end > 0; end--) {
      const slice = candidate.slice(0, end);
      try {
        return JSON.parse(slice);
      } catch {}
    }

    // As a last resort, throw with candidate preview to help debugging
    throw new Error("Failed to extract JSON. Candidate preview: " + candidate.slice(0, 2000));
  }
}
