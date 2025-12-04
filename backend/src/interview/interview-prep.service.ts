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

// Timeout for generation (60 seconds per section - increased for phi3)
const GENERATION_TIMEOUT_MS = 60000;

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

    console.log('🔍 [getInterviewContext] Looking up interview:', interviewId);

    const { data: interview, error: interviewError } = await client
      .from('interviews')
      .select('id,user_id,company_name,company_type,job_title,title,job_id')
      .eq('id', interviewId)
      .single();

    if (interviewError) {
      console.error('❌ [getInterviewContext] Interview lookup error:', interviewError);
      throw new Error(`Interview not found: ${interviewError.message}`);
    }

    if (!interview) throw new Error('Interview not found');
    if (interview.user_id !== userId) throw new Error('Unauthorized');

    console.log('📋 [getInterviewContext] Interview data:', interview);

    let companyName = interview.company_name || interview.company_type || null;
    let roleTitle = interview.job_title || null;

    console.log('🏢 [getInterviewContext] Initial companyName:', companyName, '| roleTitle:', roleTitle);

    if (interview.job_id) {
      console.log('🔗 [getInterviewContext] Looking up job:', interview.job_id);

      const { data: job, error: jobError } = await client
        .from('jobs')
        .select('company,title')
        .eq('id', interview.job_id)
        .single();

      if (jobError) {
        console.error('⚠️ [getInterviewContext] Job lookup error:', jobError);
      }

      console.log('💼 [getInterviewContext] Job data:', job);

      if (job) {
        if (!companyName) companyName = job.company;
        if (!roleTitle) roleTitle = job.title;
      }
    }

    // Only use interview.title as last resort fallback
    if (!roleTitle) roleTitle = interview.title || null;

    const result = {
      companyName: companyName || 'the company',
      roleTitle: roleTitle || 'this role',
    };

    console.log('✅ [getInterviewContext] Final context:', result);

    return result;
  }

  // ---------------- Section Generators -----------------

  private async generateCompanyResearch(companyName: string, roleTitle: string): Promise<string> {
    const prompt = `Write company research for ${roleTitle} at ${companyName}.

# Company Overview
Brief description

# Mission & Values
- Value 1
- Value 2

# Products & Services
- Service 1
- Service 2

# Recent News
- Recent development

# Questions to Ask
- Question 1
- Question 2`;

    try {
      return await this.callOllamaText(prompt);
    } catch (err) {
      console.error('⚠️ Company research timed out, using fallback');
      return this.getFallbackCompanyResearch(companyName, roleTitle);
    }
  }

  private getFallbackCompanyResearch(company: string, role: string): string {
    return `# Company Overview

${company} is a leading organization in its industry. Research their recent achievements, company culture, and strategic initiatives before your interview.

# Mission & Values

- Customer focus and innovation
- Excellence in execution
- Collaboration and teamwork
- Continuous improvement

# Products & Services

- Research ${company}'s main products and services
- Understand their market position
- Know their target customers

# Competitive Landscape

${company} operates in a competitive market. Familiarize yourself with their competitors and what sets ${company} apart.

# Recent News

- Check ${company}'s news page and press releases
- Review recent product launches or company announcements
- Stay updated on industry trends affecting ${company}

# Talking Points

- How your skills align with the ${role} position
- Examples of relevant experience
- Your understanding of ${company}'s challenges and opportunities

# Good Questions to Ask

- What does success look like in this role?
- How does this team contribute to ${company}'s goals?
- What are the biggest challenges facing the team?
- What opportunities for growth exist in this position?`;
  }

  private async generateQuestionBank(company: string, role: string): Promise<QuestionBank> {
    const prompt = `Generate interview questions for ${role} at ${company}.

List 3 questions for each category. One question per line.

BEHAVIORAL:
- Question 1
- Question 2
- Question 3

TECHNICAL:
- Question 1
- Question 2
- Question 3

SITUATIONAL:
- Question 1
- Question 2
- Question 3

COMPANY-SPECIFIC:
- Question 1
- Question 2
- Question 3`;

    try {
      const text = await this.callOllamaText(prompt);
      return this.parseQuestionBank(text, company);
    } catch (err) {
      console.error('⚠️ Question bank failed, using fallback');
      return this.getFallbackQuestionBank(company);
    }
  }

  private parseQuestionBank(text: string, company: string): QuestionBank {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const result: QuestionBank = {
      behavioral: [],
      technical: [],
      situational: [],
      companySpecific: [],
    };

    let currentCategory: keyof QuestionBank | null = null;

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.includes('behavioral')) {
        currentCategory = 'behavioral';
      } else if (lower.includes('technical')) {
        currentCategory = 'technical';
      } else if (lower.includes('situational')) {
        currentCategory = 'situational';
      } else if (lower.includes('company') || lower.includes('specific')) {
        currentCategory = 'companySpecific';
      } else if (line.startsWith('-') || line.match(/^\d+\./)) {
        // This is a question
        const question = line.replace(/^[-\d.)\s]+/, '').trim();
        if (question && currentCategory && result[currentCategory].length < 3) {
          result[currentCategory].push(question);
        }
      }
    }

    // Fill in missing questions with fallback
    const fallback = this.getFallbackQuestionBank(company);
    if (result.behavioral.length < 3) result.behavioral = fallback.behavioral;
    if (result.technical.length < 3) result.technical = fallback.technical;
    if (result.situational.length < 3) result.situational = fallback.situational;
    if (result.companySpecific.length < 3) result.companySpecific = fallback.companySpecific;

    return result;
  }

  private getFallbackQuestionBank(company: string): QuestionBank {
    return {
      behavioral: [
        "Tell me about a challenging project you worked on.",
        "Describe a time you worked with a difficult team member.",
        "Give an example of when you demonstrated leadership.",
      ],
      technical: [
        "What programming languages are you most proficient in?",
        "Explain your approach to debugging complex issues.",
        "How do you ensure code quality in your projects?",
      ],
      situational: [
        "How would you handle a tight deadline with unclear requirements?",
        "What would you do if you disagreed with your manager's decision?",
        "How do you prioritize multiple urgent tasks?",
      ],
      companySpecific: [
        `Why do you want to work at ${company}?`,
        `What do you know about ${company}'s products and services?`,
        `How would you contribute to ${company}'s mission?`,
      ],
    };
  }

  private async generateMockInterview(company: string, role: string): Promise<MockInterview> {
    const prompt = `Create a mock interview for ${role} at ${company}.

Write a brief intro (1-2 sentences).
Then list 5 interview questions with their type.

Format:
INTRO: [introduction text]

Q1 [behavioral]: [question text]
Q2 [technical]: [question text]
Q3 [situational]: [question text]
Q4 [behavioral]: [question text]
Q5 [behavioral]: [question text]

SUMMARY: [closing advice]`;

    try {
      const text = await this.callOllamaText(prompt);
      return this.parseMockInterview(text, company, role);
    } catch (err) {
      console.error('⚠️ Mock interview failed, using fallback');
      return this.getFallbackMockInterview(company, role);
    }
  }

  private parseMockInterview(text: string, company: string, role: string): MockInterview {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let intro = '';
    let summary = '';
    const questions: MockInterview['questions'] = [];

    for (const line of lines) {
      if (line.toLowerCase().startsWith('intro:')) {
        intro = line.replace(/^intro:\s*/i, '').trim();
      } else if (line.toLowerCase().startsWith('summary:')) {
        summary = line.replace(/^summary:\s*/i, '').trim();
      } else if (line.match(/^Q\d+/i)) {
        // Extract question: "Q1 [behavioral]: question text"
        const match = line.match(/Q(\d+)\s*\[([^\]]+)\]:\s*(.+)/i);
        if (match) {
          questions.push({
            id: `q${match[1]}`,
            type: match[2].trim(),
            text: match[3].trim(),
          });
        }
      }
    }

    if (!intro || questions.length < 3 || !summary) {
      return this.getFallbackMockInterview(company, role);
    }

    return { intro, questions, summary };
  }

  private getFallbackMockInterview(company: string, role: string): MockInterview {
    return {
      intro: `This mock interview simulates a real ${role} interview at ${company}. Practice your responses and timing.`,
      questions: [
        { id: "q1", type: "behavioral", text: "Tell me about yourself and your background." },
        { id: "q2", type: "behavioral", text: "Why are you interested in this role?" },
        { id: "q3", type: "technical", text: "Describe your experience with relevant technologies." },
        { id: "q4", type: "situational", text: "How would you approach your first 90 days?" },
        { id: "q5", type: "behavioral", text: "What are your salary expectations?" },
      ],
      summary: "Practice your answers using the STAR method. Be concise, authentic, and show enthusiasm for the role.",
    };
  }

  private async generateTechnicalPrep(company: string, role: string): Promise<TechnicalPrep> {
    const prompt = `Create technical prep for ${role} at ${company}.

OVERVIEW: [2-3 sentences about technical expectations]

CODING CHALLENGE:
Problem: [describe coding problem]
Hint: [helpful hint]
Solution: [step-by-step approach]

SYSTEM DESIGN:
Question: [system design question]
Key points:
- Point 1
- Point 2
- Point 3`;

    try {
      const text = await this.callOllamaText(prompt);
      return this.parseTechnicalPrep(text, company, role);
    } catch (err) {
      console.error('⚠️ Technical prep failed, using fallback');
      return this.getFallbackTechnicalPrep(role);
    }
  }

  private parseTechnicalPrep(text: string, company: string, role: string): TechnicalPrep {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let overview = '';
    let codingPrompt = '';
    let codingHint = '';
    let codingSolution = '';
    let systemPrompt = '';
    const keyPoints: string[] = [];

    let section = '';

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.startsWith('overview:')) {
        overview = line.replace(/^overview:\s*/i, '').trim();
      } else if (lower.includes('coding') && lower.includes('challenge')) {
        section = 'coding';
      } else if (lower.includes('system') && lower.includes('design')) {
        section = 'system';
      } else if (lower.startsWith('problem:')) {
        codingPrompt = line.replace(/^problem:\s*/i, '').trim();
      } else if (lower.startsWith('hint:')) {
        codingHint = line.replace(/^hint:\s*/i, '').trim();
      } else if (lower.startsWith('solution:')) {
        codingSolution = line.replace(/^solution:\s*/i, '').trim();
      } else if (lower.startsWith('question:')) {
        systemPrompt = line.replace(/^question:\s*/i, '').trim();
      } else if (line.startsWith('-') && section === 'system') {
        const point = line.replace(/^-\s*/, '').trim();
        if (point) keyPoints.push(point);
      }
    }

    if (!overview || !codingPrompt || !systemPrompt) {
      return this.getFallbackTechnicalPrep(role);
    }

    return {
      overview,
      codingChallenge: {
        prompt: codingPrompt,
        hint: codingHint || 'Think about data structures that can help optimize lookups.',
        solutionOutline: codingSolution || 'Break the problem into smaller steps.',
      },
      systemDesign: {
        prompt: systemPrompt,
        keyPoints: keyPoints.length > 0 ? keyPoints : ['Scalability', 'Data storage', 'Performance'],
      },
    };
  }

  private getFallbackTechnicalPrep(role: string): TechnicalPrep {
    return {
      overview: `Expect coding challenges and system design questions appropriate for a ${role} position. Focus on problem-solving approach and communication.`,
      codingChallenge: {
        prompt: "Write a function to find the longest substring without repeating characters.",
        hint: "Use a sliding window approach with a hash map to track character positions.",
        solutionOutline: "1. Use two pointers (start, end)\n2. Track character positions in a map\n3. When duplicate found, move start pointer\n4. Update max length",
      },
      systemDesign: {
        prompt: "Design a URL shortening service like bit.ly",
        keyPoints: [
          "Database schema for URL mappings",
          "Hash function for generating short codes",
          "Caching strategy for popular URLs",
          "Scalability and load balancing",
          "Analytics and tracking",
        ],
      },
    };
  }

  private async generateChecklist(company: string, role: string): Promise<Checklist> {
    const prompt = `Create interview prep checklist for ${role} at ${company}.

List 8 tasks. Format each as:
[category] task description (when to do it)

Categories: research, practice, logistics, materials
Example:
[research] Research company mission (1 week before)
[practice] Practice STAR method (3 days before)`;

    try {
      const text = await this.callOllamaText(prompt);
      return this.parseChecklist(text, company);
    } catch (err) {
      console.error('⚠️ Checklist failed, using fallback');
      return this.getFallbackChecklist(company);
    }
  }

  private parseChecklist(text: string, company: string): Checklist {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const items: Checklist['items'] = [];

    for (const line of lines) {
      // Match: [category] task (time)
      const match = line.match(/\[([^\]]+)\]\s*([^(]+)\s*\(([^)]+)\)/);
      if (match) {
        items.push({
          id: String(items.length + 1),
          label: match[2].trim(),
          category: match[1].trim().toLowerCase(),
          suggestedTime: match[3].trim(),
        });
      }
    }

    if (items.length < 5) {
      return this.getFallbackChecklist(company);
    }

    return { items };
  }

  private getFallbackChecklist(company: string): Checklist {
    return {
      items: [
        { id: "1", label: `Research ${company}'s mission and values`, category: "research", suggestedTime: "1 week before" },
        { id: "2", label: "Review job description thoroughly", category: "research", suggestedTime: "1 week before" },
        { id: "3", label: "Practice common interview questions", category: "practice", suggestedTime: "3 days before" },
        { id: "4", label: "Prepare STAR method examples", category: "practice", suggestedTime: "3 days before" },
        { id: "5", label: "Research interviewers on LinkedIn", category: "research", suggestedTime: "2 days before" },
        { id: "6", label: "Prepare questions to ask", category: "research", suggestedTime: "2 days before" },
        { id: "7", label: "Plan route and transportation", category: "logistics", suggestedTime: "1 day before" },
        { id: "8", label: "Print resume copies", category: "materials", suggestedTime: "1 day before" },
      ],
    };
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: OLLAMA_MODEL, 
          prompt, 
          stream: false,
          options: {
            temperature: 0.3,  // Lower = more consistent/predictable
            num_predict: 500,  // Shorter responses = faster generation
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const wrapper = await response.json();
      return wrapper.response || '';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Generation timed out after ${GENERATION_TIMEOUT_MS / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
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

    // remove leading junk like "Here's your JSON:"
    text = text.replace(/^[^({\[]+/g, "").trim();

    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    
    let startIndex = -1;
    if (firstBrace === -1 && firstBracket === -1) {
      throw new Error("No JSON found");
    } else if (firstBrace === -1) {
      startIndex = firstBracket;
    } else if (firstBracket === -1) {
      startIndex = firstBrace;
    } else {
      startIndex = Math.min(firstBrace, firstBracket);
    }

    let candidate = text.slice(startIndex);

    // 1. Fix common phi3 mistakes
    // Replace single quotes with double quotes (but not in content)
    candidate = candidate.replace(/'([^']*)':/g, '"$1":'); // Property names
    candidate = candidate.replace(/:\s*'([^']*)'/g, ': "$1"'); // String values
    
    // Fix malformed property names like "idin"", "idde", "ide", "idf"
    candidate = candidate.replace(/"id[a-z]*":/g, '"id":');
    
    // Fix missing colons after properties
    candidate = candidate.replace(/"([^"]+)"\s+"([^"]+)"/g, '"$1": "$2"');

    // 2. remove trailing commas (before closing brackets/braces)
    candidate = candidate.replace(/,(\s*[}\]])/g, "$1");

    // 3. remove comments
    candidate = candidate.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

    // 3. fix brace/bracket imbalance
    const openBrace = (candidate.match(/{/g) || []).length;
    const closeBrace = (candidate.match(/}/g) || []).length;
    const openBracket = (candidate.match(/\[/g) || []).length;
    const closeBracket = (candidate.match(/]/g) || []).length;
    
    if (openBrace > closeBrace) {
      candidate += "}".repeat(openBrace - closeBrace);
    }
    if (openBracket > closeBracket) {
      candidate += "]".repeat(openBracket - closeBracket);
    }

    // try full parse first
    try {
      const parsed = JSON.parse(candidate);
      // Fix QuestionBank if it has {text: ...} objects instead of strings
      return this.normalizeQuestionBank(parsed);
    } catch (e) {
      console.error("⚠️ JSON parse error:", e.message);
      console.error("Attempted to parse:", candidate.slice(0, 500));
    }

    // try to find the last complete object/array by walking backwards
    let bestMatch = null;
    let bestLength = 0;

    for (let end = candidate.length; end > startIndex + 10; end -= 10) {
      const slice = candidate.slice(0, end);
      
      // Count braces
      const ob = (slice.match(/{/g) || []).length;
      const cb = (slice.match(/}/g) || []).length;
      const oar = (slice.match(/\[/g) || []).length;
      const car = (slice.match(/]/g) || []).length;
      
      // Try to balance it
      let balanced = slice;
      if (ob > cb) balanced += "}".repeat(ob - cb);
      if (oar > car) balanced += "]".repeat(oar - car);
      
      try {
        const parsed = JSON.parse(balanced);
        if (balanced.length > bestLength) {
          bestMatch = parsed;
          bestLength = balanced.length;
        }
      } catch {}
    }

    if (bestMatch) {
      console.log("✅ Recovered partial JSON");
      return this.normalizeQuestionBank(bestMatch);
    }

    // As a last resort, throw with candidate preview
    throw new Error("Failed to extract JSON. Candidate preview: " + candidate.slice(0, 1000));
  }

  // Convert {text: "..."} objects to strings if needed
  private normalizeQuestionBank(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Fix QuestionBank arrays
    if (data.behavioral && Array.isArray(data.behavioral)) {
      ['behavioral', 'technical', 'situational', 'companySpecific'].forEach(key => {
        if (Array.isArray(data[key])) {
          data[key] = data[key].map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && item.text) return item.text;
            if (item && typeof item === 'object' && item.query) return item.query;
            return String(item);
          });
        }
      });
    }

    // Fix TechnicalPrep keyPoints if it's an object instead of array
    if (data.systemDesign && data.systemDesign.keyPoints) {
      if (!Array.isArray(data.systemDesign.keyPoints)) {
        // Convert object to array of values
        const points = data.systemDesign.keyPoints;
        if (typeof points === 'object') {
          data.systemDesign.keyPoints = Object.values(points).map(v => 
            typeof v === 'string' ? v : String(v)
          );
        } else {
          data.systemDesign.keyPoints = [String(points)];
        }
      } else {
        // Ensure all items are strings
        data.systemDesign.keyPoints = data.systemDesign.keyPoints.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.text) return item.text;
          return String(item);
        });
      }
    }

    // Fix MockInterview questions if needed
    if (data.questions && Array.isArray(data.questions)) {
      data.questions = data.questions.map(q => {
        if (q && typeof q === 'object' && q.id && q.type && q.text) {
          return { id: String(q.id), type: String(q.type), text: String(q.text) };
        }
        return q;
      });
    }

    // Fix Checklist items if needed
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map(item => {
        if (item && typeof item === 'object') {
          return {
            id: String(item.id || ''),
            label: String(item.label || ''),
            category: String(item.category || ''),
            suggestedTime: item.suggestedTime ? String(item.suggestedTime) : undefined,
          };
        }
        return item;
      });
    }

    return data;
  }
}
